// Real API bookings with existing accounts, exact-tag fixtures cleaned in finally.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'frontend/package.json'));
const { chromium, request, expect }=require('@playwright/test');
const api=await request.newContext({baseURL:'http://127.0.0.1:5173'});
const accounts=JSON.parse(fs.readFileSync(path.join(root,'.local/test-accounts.json'),'utf8'));
const login=async role=>{
  const r=await api.post('/api/auth/login',{data:{email:accounts[role].email,matKhau:accounts[role].password}});
  assert.equal(r.status(),200);return r.json();
};
const admin=await login('admin'),user=await login('user');
const tag='coverage-'+Date.now();
const fixture=action=>execFileSync('dotnet',['run','--no-build','--project',path.join(root,'tests/AdminSmoke'),'--',path.join(root,'backend'),'--coverage-fixtures',action,tag],{cwd:root,encoding:'utf8'});
const f=JSON.parse(fixture('create').trim());
let browser;
const checks=[],errors=[];
try {
  browser=await chromium.launch();
  const rooms=[];
  for(let i=0;i<2;i++) {
    const r=await api.post('/api/loaiphong',{headers:{Authorization:'Bearer '+admin.token},data:{maKhachSan:f.hotel,tenLoaiPhong:tag+'-'+i,sucChua:2,soLuongPhong:1,giaMoiDem:300000,trangThai:true}});
    assert.equal(r.status(),201);rooms.push((await r.json()).maLoaiPhong);
  }
  for(const width of [1440,390]) {
    const ctx=await browser.newContext({baseURL:'http://127.0.0.1:5173',viewport:{width,height:960},reducedMotion:'reduce'});
    await ctx.addInitScript(s=>localStorage.setItem('tripmate_auth',JSON.stringify(s)),user);
    const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/account?tab=hotels');
    await expect(page.getByRole('button',{name:'Phòng đã đặt',exact:true})).toHaveAttribute('aria-pressed','true');
    await page.getByRole('button',{name:'Lịch trình của tôi',exact:true}).click();
    await expect(page).toHaveURL(/tab=trips/);
    await page.goBack();
    await expect(page.getByRole('button',{name:'Phòng đã đặt',exact:true})).toHaveAttribute('aria-pressed','true');
    checks.push(`${width}: account URL, tabs and Back agree`);
    const booking=`/hotels/${f.hotel}/book?room=${rooms[0]}`;
    await page.goto(booking);
    await expect(page.getByRole('combobox',{name:'Loại phòng',exact:true})).toHaveValue(String(rooms[0]));
    await page.getByLabel('Số khách',{exact:true}).fill('2');
    // Exercise same-route client-side navigation, not a document reload.
    await page.evaluate(url=>{history.pushState({},'',url);window.dispatchEvent(new PopStateEvent('popstate'));},`/hotels/${f.hotel}/book?room=${rooms[1]}`);
    await expect(page.getByRole('combobox',{name:'Loại phòng',exact:true})).toHaveValue(String(rooms[1]));
    await expect(page.getByLabel('Số khách',{exact:true})).toHaveValue('1');
    checks.push(`${width}: changing room resets booking form`);
    const start=new Date(Date.now()+(width===1440?80:90)*86400000).toISOString().slice(0,10);
    const end=new Date(Date.parse(start)+86400000).toISOString().slice(0,10);
    await page.getByLabel('Ngày nhận phòng').fill(start);
    await page.getByLabel('Ngày trả phòng').fill(end);
    await page.getByLabel('Ghi chú (không bắt buộc)').fill(tag);
    // Only this error response is simulated; the next submit reaches the real API.
    await page.route('**/api/account/bookings/hotels',r=>r.fulfill({status:400,json:{errors:{SoNguoi:['Invalid']}}}),{times:1});
    await page.getByRole('button',{name:'Xác nhận yêu cầu đặt chỗ'}).click();
    await expect(page.getByRole('alert')).toContainText('Dữ liệu chưa hợp lệ');
    await expect(page.getByLabel('Ngày nhận phòng')).toHaveValue(start);
    checks.push(`${width}: validation error keeps entered dates`);
    const response=page.waitForResponse(r=>r.url().endsWith('/api/account/bookings/hotels') && r.request().method()==='POST');
    await page.getByRole('button',{name:'Xác nhận yêu cầu đặt chỗ'}).click();
    assert.equal((await response).status(),201);
    await expect(page.getByRole('heading',{name:'Yêu cầu đặt chỗ đã được lưu.'})).toBeVisible();
    await expect(page.getByRole('link',{name:'Xem đơn đặt của tôi'})).toHaveAttribute('href','/account?tab=hotels');
    await page.getByRole('link',{name:'Xem đơn đặt của tôi'}).click();
    await expect(page.getByRole('button',{name:'Phòng đã đặt',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('.booking-record').filter({hasText:tag})).toHaveCount(width===1440?1:2);
    await expect(page.locator('.booking-record').filter({hasText:tag}).last()).toContainText('300.000');
    checks.push(`${width}: real booking saved and shown in hotel tab`);
    assert(await page.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth+2));
    await page.screenshot({path:path.join(root,`.local/completion-after-${width}.png`),fullPage:true});
    await ctx.close();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({checks,errors},null,2));
} finally {
  await browser?.close();await api.dispose();
  console.log(fixture('cleanup').trim());
}
