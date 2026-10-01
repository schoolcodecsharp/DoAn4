// Read-only coverage/UI tests plus rejected invalid admin input; no fixtures.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, request, expect } = require('@playwright/test');
const api = await request.newContext({ baseURL: 'http://127.0.0.1:5173' });
const browser = await chromium.launch();
const checks = [], errors = [];
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'database/verified-catalog-20261001.json'), 'utf8'));
async function get(url) {
  const r = await api.get('/api/' + url);
  assert.equal(r.status(), 200, url);
  return r.json();
}
try {
  const provinces = await get('provinces');
  assert.equal(provinces.length, 34);
  assert.equal(new Set(provinces.map(p => p.code)).size, 34);
  assert(provinces.every(p => p.aliases instanceof Array && p.verifiedOn === '2026-10-01'));
  const kinds = [['destinations', 'diadiem', 'maDiaDiem'], ['hotels', 'khachsan', 'maKhachSan'], ['restaurants', 'nhahang', 'maNhaHang'], ['tours', 'tour', 'maTour']];
  const data = Object.fromEntries(await Promise.all(kinds.map(async ([, endpoint]) => [endpoint, await get(endpoint)])));
  for (const p of provinces) {
    for (const [, endpoint] of kinds)
      assert(data[endpoint].some(d => (d.trangThai === true || d.trangThai === 'Active') && d.tinhThanh?.split(',').map(s => s.trim()).includes(p.name)), p.name + ': ' + endpoint);
    for (const alias of p.aliases) for (const endpoint of ['diadiem', 'khachsan']) {
      const rows = await get(endpoint + '?tinh=' + encodeURIComponent(alias));
      assert(rows.length && rows.every(row => row.tinhThanh === p.name), alias);
    }
  }
  checks.push('34 provinces x 4 active catalog groups; legacy aliases resolve in filtered APIs');
  for (const d of manifest.destinations) {
    const dest = data.diadiem.filter(row => row.tenDiaDiem === d.name && row.tinhThanh === d.province);
    assert.equal(dest.length, 1);
    assert(dest[0].moTa.includes(d.source));
    const tour = data.tour.find(row => row.tenTour === 'Tham khảo ' + d.province + ': ' + d.name);
    assert(tour && tour.giaTour === 0 && tour.soNguoiToiDa === 0 && tour.soNguoiToiThieu === 0);
    assert.equal((await get('tourkhoihanh/bytour/' + tour.maTour)).length, 0);
    const stops = await get('tourchitiet/bytour/' + tour.maTour);
    assert.equal(stops.length, 1); assert.equal(stops[0].maDiaDiem, dest[0].maDiaDiem);
    assert.equal(stops[0].ngayThu, 1); assert(!stops[0].thoiGianBatDau);
  }
  for (const s of manifest.stays) {
    const hotel = data.khachsan.filter(h => h.tenKhachSan === s.hotel && h.tinhThanh === s.province);
    const restaurant = data.nhahang.filter(r => r.tenNhaHang === s.restaurant && r.tinhThanh === s.province);
    assert.equal(hotel.length, 1); assert.equal(restaurant.length, 1);
    assert.equal((await get('loaiphong/bykhachsan/' + hotel[0].maKhachSan)).length, 0);
    assert(s.sources.every(source => hotel[0].moTa.includes(source) && restaurant[0].moTa.includes(source)));
  }
  checks.push('72 unique sourced records; complete reference stops; no invented room inventory or departures');
  const accounts = JSON.parse(fs.readFileSync(path.join(root, '.local/test-accounts.json'), 'utf8'));
  const auth = await api.post('/api/auth/login', { data: { email: accounts.admin.email, matKhau: accounts.admin.password } });
  assert.equal(auth.status(), 200);
  const session = await auth.json();
  const headers = { Authorization: 'Bearer ' + session.token };
  for (const [endpoint, nameKey] of [['diadiem', 'tenDiaDiem'], ['khachsan', 'tenKhachSan'], ['nhahang', 'tenNhaHang']]) {
    const r = await api.post('/api/' + endpoint, { headers, data: { [nameKey]: 'Invalid province must not save', tinhThanh: 'Không có tỉnh này' } });
    assert.equal(r.status(), 400, endpoint + ' rejects invalid province');
    assert((await r.json()).message.includes('tỉnh/thành'));
  }
  checks.push('Admin writes reject unknown provinces');
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173', viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const externalRequests = [];
    page.on('request', r => { if (r.url().includes('provinces.open-api.vn')) externalRequests.push(r.url()); });
    for (const [kind] of kinds) {
      await page.goto('/' + kind);
      const select = page.getByLabel('Tỉnh / thành phố');
      await expect(select.locator('option')).toHaveCount(35);
      for (const province of provinces) {
        await select.selectOption(province.name);
        await expect(page.locator('.catalog-card').first()).toBeVisible();
        await expect(page.locator('.section-line')).toContainText('tại ' + province.name);
      }
      assert(await page.locator('main').evaluate(e => e.scrollWidth <= e.clientWidth + 2), kind + ' overflow');
    }
    await page.goto('/hotels?province=' + encodeURIComponent('Bến Tre'));
    await expect(page.getByLabel('Tỉnh / thành phố')).toHaveValue('Vĩnh Long');
    await expect(page.locator('.catalog-grid')).toContainText('Bến Tre Riverside');
    await page.goto('/destinations?keyword=ha%20giang');
    await expect(page.locator('.catalog-card').first()).toBeVisible();
    await page.goto('/tours?province=' + encodeURIComponent('Bắc Giang'));
    await expect(page.getByLabel('Tỉnh / thành phố')).toHaveValue('Bắc Ninh');
    await expect(page.locator('.catalog-grid')).toContainText('Đền Đô');
    await page.screenshot({ path: path.join(root, '.local/provinces-catalog-' + width + '.png'), fullPage: true });
    await page.locator('.catalog-card h3 a').first().click();
    await expect(page.getByText('Không phải chương trình', { exact: false })).toBeVisible();
    await expect(page.getByText('Chưa có lịch khởi hành đang mở. Vui lòng quay lại sau.')).toBeVisible();
    assert.equal(await page.getByRole('link', { name: 'Đặt tour', exact: true }).count(), 0);
    await page.evaluate(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), session);
    await page.goto('/admin/provinces');
    await expect(page.getByText('34 bản ghi')).toBeVisible();
    await page.goto('/admin/coverage');
    await expect(page.getByText('25/25 bảng hiện có đã được ánh xạ.')).toBeVisible();
    await page.goto('/admin/hotels');
    await page.getByRole('button', { name: '+ Thêm mới', exact: true }).click();
    await expect(page.getByLabel('Tỉnh / thành phố', { exact: true }).locator('option')).toHaveCount(35);
    await expect(page.getByLabel('Tỉnh / thành phố', { exact: true }).locator('option').first()).toHaveText('Chọn tỉnh / thành phố');
    await page.screenshot({ path: path.join(root, '.local/provinces-admin-' + width + '.png'), fullPage: true });
    assert(await page.locator('main').evaluate(e => e.scrollWidth <= e.clientWidth + 2), 'admin overflow');
    assert.deepEqual(externalRequests, []);
    await context.close();
    checks.push(width + 'px: four catalogs x 34 filters, alias links/search, reference detail, admin table/selector, no overflow/external province API');
  }
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' });
  const page = await context.newPage();
  await page.route('**/api/provinces', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.goto('/hotels');
  await expect(page.getByLabel('Tỉnh / thành phố')).toBeDisabled();
  await expect(page.locator('.catalog-card').first()).toBeVisible();
  await page.unroute('**/api/provinces');
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByLabel('Tỉnh / thành phố').locator('option')).toHaveCount(35);
  await context.close();
  checks.push('Province API failure preserves catalog and retry recovers all 34');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks, errors }, null, 2));
} finally {
  await browser.close(); await api.dispose();
}
