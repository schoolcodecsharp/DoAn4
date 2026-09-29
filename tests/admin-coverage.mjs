// Existing accounts only. Exact tagged fixtures are removed in finally.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'frontend/package.json'));
const {chromium,request,expect}=require('@playwright/test');
const credentials=JSON.parse(fs.readFileSync(path.join(root,'.local/test-accounts.json'),'utf8'));
const api=await request.newContext({baseURL:'http://127.0.0.1:5173'});
const login=async role=>{const r=await api.post('/api/auth/login',{data:{email:credentials[role].email,matKhau:credentials[role].password}});assert.equal(r.status(),200);return r.json();};
const admin=await login('admin'),user=await login('user');
const headers={Authorization:'Bearer '+admin.token};
assert.equal((await api.get('/api/admin/coverage')).status(),401);
assert.equal((await api.get('/api/admin/coverage',{headers:{Authorization:'Bearer '+user.token}})).status(),403);
const schema=await (await api.get('/api/admin/coverage',{headers})).json();
const tag='coverage-'+Date.now();
const fixture=action=>execFileSync('dotnet',['run','--no-build','--project',path.join(root,'tests/AdminSmoke'),'--',path.join(root,'backend'),'--coverage-fixtures',action,tag],{cwd:root,encoding:'utf8'});
const f=JSON.parse(fixture('create').trim());
const browser=await chromium.launch();const errors=[],routes=[],checks=[];
try{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:5173',viewport:{width:1440,height:1000}});
  await context.addInitScript(s=>localStorage.setItem('tripmate_auth',JSON.stringify(s)),admin);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('https://provinces.open-api.vn/**',r=>r.fulfill({json:[{code:22,name:'Tỉnh Quảng Ninh'}]}));
  await page.goto('/admin/coverage');await expect(page.getByRole('status')).toContainText(`${schema.tables.length}/${schema.tables.length}`);
  const links=await page.locator('tbody a').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
  assert.equal(links.length,schema.tables.length);checks.push('All live database tables have a management route');
  for(const route of ['/admin/coverage',...new Set(links)]){
    await page.goto(route);await page.waitForLoadState('networkidle');
    await expect(page.locator('.admin-content h1,.admin-content h2').first()).toBeVisible();
    assert.equal(await page.locator('[role="alert"]').count(),0,'API/render error on '+route);
    for(const width of [1440,390]){
      await page.setViewportSize({width,height:1000});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow '+route+' '+width);
      if(['/admin/coverage','/admin/trips','/admin/payments','/admin/rooms'].includes(route))await page.screenshot({path:path.join(root,`.local/coverage-${route.split('/').pop()}-${width}.jpg`),quality:55});
    }
    routes.push(route);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`/admin/rooms?hotel=${f.hotel}`);await page.getByRole('button',{name:'+ Thêm mới',exact:true}).click();
  await page.getByLabel('Tên loại phòng').fill(tag);await page.getByLabel('Giá mỗi đêm (đ)').fill('500000');
  let response=page.waitForResponse(r=>r.url().endsWith('/api/loaiphong')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Lưu thông tin',exact:true}).click();let saved=await response;assert.equal(saved.status(),201,await saved.text());
  const room=await saved.json();assert.ok(room.maLoaiPhong);await expect(page.getByRole('heading',{name:/Bộ ảnh/})).toBeVisible();
  checks.push('Create room under hotel and open image manager');
  await page.goto('/admin/coupons');await page.getByRole('button',{name:'+ Thêm mới',exact:true}).click();
  await page.getByLabel('Mã giảm giá *',{exact:true}).fill(tag.toUpperCase());
  await page.getByLabel('Hiệu lực từ').fill('2027-01-01T00:00');await page.getByLabel('Hiệu lực đến').fill('2027-02-01T00:00');
  response=page.waitForResponse(r=>r.url().endsWith('/api/magiamgia')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Lưu thông tin',exact:true}).click();saved=await response;assert.equal(saved.status(),201,await saved.text());
  const couponId=(await saved.json()).id;await expect(page.getByLabel('Mã giảm giá *',{exact:true})).toBeDisabled();
  assert.equal((await api.put(`/api/magiamgia/${couponId}`,{headers,data:{giaTriGiam:101}})).status(),400);
  checks.push('Create coupon with dates, immutable code and server percentage guard');
  await page.goto(`/admin/expenses?trip=${f.trip}`);await page.getByRole('button',{name:'+ Thêm mới',exact:true}).click();
  await page.getByLabel('Tên khoản chi').fill(tag);await page.getByLabel('Số tiền (đ)').fill('125000');await page.getByLabel('Ngày chi').fill('2027-01-01');
  response=page.waitForResponse(r=>r.url().endsWith('/api/chiphi')&&r.request().method()==='POST');await page.getByRole('button',{name:'Lưu thông tin',exact:true}).click();saved=await response;assert.equal(saved.status(),201,await saved.text());
  assert.equal((await api.post('/api/chiphi',{headers,data:{maChuyenDi:f.trip,tenChiPhi:'invalid',soTien:-1}})).status(),400);
  checks.push('Create expense in linked trip and reject negative amount');
  await page.goto(`/admin/reviews?id=${f.review}`);await page.getByRole('button',{name:`Xem chi tiết #${f.review}`,exact:true}).click();
  response=page.waitForResponse(r=>r.url().endsWith(`/api/danhgia/${f.review}`)&&r.request().method()==='PUT');await page.getByRole('button',{name:'Ẩn đánh giá',exact:true}).click();assert.equal((await response).status(),204);
  const review=await (await api.get(`/api/danhgia/${f.review}`,{headers})).json();assert.equal(review.soSao,4);assert.equal(review.noiDung,tag);assert.equal(review.trangThai,false);
  checks.push('Review moderation retains customer text and stars');
  await page.goto('/admin/payments');await page.getByRole('button',{name:'Ghi nhận thanh toán',exact:true}).click();
  await page.getByLabel('Đơn cần thanh toán').selectOption(String(f.order));await page.getByLabel('Số tiền (đ)',{exact:true}).fill('100000');
  response=page.waitForResponse(r=>r.url().endsWith('/api/thanhtoan')&&r.request().method()==='POST');await page.getByRole('button',{name:'Tạo giao dịch chờ xác nhận',exact:true}).click();saved=await response;assert.equal(saved.status(),201,await saved.text());
  const paymentId=(await saved.json()).id;
  const paymentRow=page.getByRole('row').filter({has:page.getByRole('link',{name:`Đơn tour #${f.order}`,exact:true})});
  response=page.waitForResponse(r=>r.url().endsWith(`/api/thanhtoan/${paymentId}`)&&r.request().method()==='PUT');await paymentRow.getByRole('button',{name:'Xác nhận đã thu',exact:true}).click();assert.equal((await response).status(),204);
  await expect(paymentRow).toContainText('Đã thu tiền');await expect(paymentRow).toContainText('Chỉ xem');
  await paymentRow.getByRole('link').click();await expect(page.locator('tbody tr')).toHaveCount(1);
  checks.push('Record and confirm isolated payment, lock terminal state, follow correct order');
  await page.goto('/admin/trips?id='+f.trip);await page.getByRole('button',{name:`Xem chi tiết #${f.trip}`}).click();await page.getByRole('link',{name:'Các khoản chi',exact:true}).click();await expect(page).toHaveURL(new RegExp('/admin/expenses\\?trip='+f.trip));await expect(page.locator('tbody strong').filter({hasText:tag})).toBeVisible();
  checks.push('Trip relation opens its own expenses');
  assert.equal(errors.length,0);console.log(JSON.stringify({tables:schema.tables.length,routes,checks,pageErrors:errors},null,2));
}finally{await browser.close();console.log(fixture('cleanup'));await api.dispose();}
