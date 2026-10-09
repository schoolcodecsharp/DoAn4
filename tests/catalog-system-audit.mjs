// Read-only HTTP/browser audit. Uses existing accounts, never creates users or orders.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, request, expect } = require('@playwright/test');
const api = await request.newContext({ baseURL: 'http://127.0.0.1:5173' });
const accounts = JSON.parse(fs.readFileSync(path.join(root, '.local/test-accounts.json'), 'utf8'));
const sessions = {};
const httpChecks = [], uiChecks = [], failures = [], browserErrors = [];
const collections = ['diadiem','khachsan','nhahang','tour','tourchitiet','tourkhoihanh','hinhanh','loaiphong','loaidiadiem','vaitro','nguoidung','dattour','datphong','chuyendi','thanhvienchuyendi','lichtrinh','lichtrinhchitiet','thanhtoan','magiamgia','chiphi','danhgia','yeuthich','binhluan'];
const publicNames = new Set(collections.slice(0,9));
const data = {};
const browser = await chromium.launch();
try {
  for (const role of ['admin','user']) {
    const r = await api.post('/api/auth/login', { data: { email: accounts[role].email, matKhau: accounts[role].password } });
    assert.equal(r.status(),200,`existing ${role} login`); sessions[role] = await r.json();
  }
  async function get(url, role, status = 200) {
    const response = await api.get('/api/' + url, { headers: role ? { Authorization: 'Bearer ' + sessions[role].token } : {} });
    httpChecks.push({ url, role: role || 'anonymous', status: response.status() });
    assert.equal(response.status(), status, `${role || 'anonymous'} GET ${url}`);
    return status === 200 ? response.json() : null;
  }
  for (const name of collections) {
    await get(name, null, publicNames.has(name) ? 200 : 401);
    await get(name, 'user', publicNames.has(name) ? 200 : 403);
    data[name] = await get(name, 'admin');
    assert(Array.isArray(data[name]),name);
    await get(name+'/2147483647', publicNames.has(name) ? null : 'admin',404);
    const specialKeys = { lichtrinhchitiet:'maChiTiet', thanhvienchuyendi:'maThanhVien' };
    const key = specialKeys[name] || Object.keys(data[name][0] || {}).find(key => key.toLowerCase() === 'ma'+name);
    if (key && name !== 'nguoidung') {
      const samples = publicNames.has(name) ? data[name] : data[name].slice(0,1);
      for (const item of samples) if (typeof item[key] === 'number') await get(`${name}/${item[key]}`, publicNames.has(name) ? null : 'admin');
    }
  }
  for (const url of ['admin/coverage','admin/dashboard','admin/audit']) {
    await get(url,null,401); await get(url,'user',403); await get(url,'admin');
  }
  await get('account',null,401); await get('account','user'); await get('auth/me','user');
  for (const tour of data.tour) {
    await get('tourchitiet/bytour/'+tour.maTour);
    await get('tourkhoihanh/bytour/'+tour.maTour);
  }
  for (const hotel of data.khachsan) await get('loaiphong/bykhachsan/'+hotel.maKhachSan);
  const kinds = [['destinations','diadiem','maDiaDiem'],['hotels','khachsan','maKhachSan'],['restaurants','nhahang','maNhaHang'],['tours','tour','maTour']];
  const provinces = [...new Set(data.diadiem.filter(d=>d.trangThai && d.tinhThanh).map(d=>d.tinhThanh))];
  for (const province of provinces) for (const [,endpoint] of kinds) {
    assert(data[endpoint].some(d => (d.trangThai === true || d.trangThai === 'Active') && (d.tinhThanh || d.diemDen || '').includes(province)), `${province}: ${endpoint} missing`);
  }
  for (const width of [1440,390]) {
    const context = await browser.newContext({ baseURL:'http://127.0.0.1:5173', viewport:{width,height:960}, reducedMotion:'reduce' });
    const page = await context.newPage();
    page.on('pageerror',e=>browserErrors.push(e.message));
    page.on('response',r=> { if (r.url().includes('/api/') && r.status()>=500) browserErrors.push(`${r.status()} ${r.url()}`); });
    async function visit(url) {
      await page.goto(url); await page.waitForLoadState('networkidle');
      const main = page.locator('main').first(); await expect(main).toBeVisible();
      const overflow = await main.evaluate(e=>e.scrollWidth > e.clientWidth + 2);
      if(overflow) failures.push({url,width,issue:'horizontal overflow'});
      const alerts = await page.locator('main [role=alert]').allTextContents();
      if(alerts.length) failures.push({url,width,issue:alerts});
      uiChecks.push({url,width});
    }
    for (const url of ['/','/login','/register','/image-credits']) await visit(url);
    for (const [kind,endpoint,id] of kinds) {
      await visit('/'+kind);
      for (const province of provinces) {
        await page.getByLabel('Tỉnh / thành phố').selectOption(province);
        await expect(page.locator('.catalog-card').first()).toBeVisible();
      }
      for(const item of data[endpoint].filter(d=>d.trangThai===true || d.trangThai==='Active')) await visit(`/${kind}/${item[id]}`);
    }
    await visit('/restaurants/17');
    await expect(page.getByText('Chi phí: liên hệ nhà hàng để xác nhận.')).toBeVisible();
    await expect(page.getByRole('link',{name:'Xem nguồn thông tin tại website đơn vị'})).toHaveAttribute('href',/^https:\/\//);
    await page.screenshot({path:path.join(root,`.local/catalog-verified-detail-${width}.png`)});
    await visit('/hotels?province='+encodeURIComponent('Hưng Yên'));
    await page.locator('.catalog-grid').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(root,`.local/catalog-verified-list-${width}.png`)});
    await page.locator('.catalog-filter-disclosure > summary').click();
    await page.getByLabel('Giá đến (đ)').fill('1000000');
    await expect(page.getByText('Chưa có kết quả phù hợp')).toBeVisible();
    await page.evaluate(s=>localStorage.setItem('tripmate_auth',JSON.stringify(s)),sessions.user);
    for(const url of ['/account','/planner','/tours/1/book','/hotels/1/book']) await visit(url);
    await context.close();
  }
  assert.deepEqual(browserErrors,[]);
  assert.deepEqual(failures,[]);
  console.log(JSON.stringify({httpChecks:httpChecks.length,uiRoutes:uiChecks.length,provinceGroups:provinces.length,failures,browserErrors},null,2));
} finally {
  fs.writeFileSync(path.join(root,'.local/catalog-system-audit.json'),JSON.stringify({httpChecks,uiChecks,failures,browserErrors},null,2));
  await browser.close(); await api.dispose();
}
