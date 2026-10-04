// Local services + existing SQL accounts. Creates only tagged itineraries; cleans them in finally.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'frontend/package.json'));
const {chromium,request,expect}=require('@playwright/test');
const accounts=JSON.parse(fs.readFileSync(path.join(root,'.local/test-accounts.json'),'utf8'));
const api=await request.newContext({baseURL:'http://localhost:5173'});
const sessions={};
for(const role of ['user','admin']){
  const r=await api.post('/api/auth/login',{data:{email:accounts[role].email,matKhau:accounts[role].password}});
  assert.equal(r.status(),200);sessions[role]=await r.json();
}
const headers={Authorization:'Bearer '+sessions.user.token},adminHeaders={Authorization:'Bearer '+sessions.admin.token};
const browser=await chromium.launch();
const trips=[],errors=[],checks=[];
const review=path.join(root,'.impeccable/review/planner');fs.mkdirSync(review,{recursive:true});
const tag='planner-ui-'+Date.now();
const start=new Date();start.setUTCDate(start.getUTCDate()+90);const date=start.toISOString().slice(0,10);
try{
  const [places,hotels,restaurants]=await Promise.all(['diadiem','khachsan','nhahang'].map(async kind=>(await api.get('/api/'+kind)).json()));
  const place=places.find(p=>p.trangThai&&p.giaVe>0&&p.hinhAnh?.length);
  const hotel=hotels.find(p=>p.trangThai&&p.hinhAnh?.length);
  const restaurant=restaurants.find(p=>p.trangThai&&p.hinhAnh?.length);
  assert(place&&hotel&&restaurant);
  const rooms=await (await api.get('/api/loaiphong/bykhachsan/'+hotel.maKhachSan)).json();
  const room=rooms.find(r=>r.trangThai&&r.soLuongPhong>=1&&r.sucChua>=2);assert(room);
  const activities=[
    {loaiDiaDiem:'DiaDiem',maDoiTuong:place.maDiaDiem,thoiGianBatDau:'08:00:00',thoiGianKetThuc:'10:00:00',ghiChu:'Tham quan và chụp ảnh',quantity:2},
    {loaiDiaDiem:'NhaHang',maDoiTuong:restaurant.maNhaHang,thoiGianBatDau:'11:00:00',thoiGianKetThuc:'12:00:00',ghiChu:'Ăn trưa',quantity:2},
    {loaiDiaDiem:'KhachSan',maDoiTuong:hotel.maKhachSan,thoiGianBatDau:'14:00:00',thoiGianKetThuc:'15:00:00',ghiChu:'Nhận phòng và nghỉ ngơi',roomId:room.maLoaiPhong,rooms:1,nights:2,quantity:2},
  ];
  for(const width of [1440,390]){
    const create=await api.post('/api/account/itineraries',{headers,data:{tenChuyenDi:tag+'-'+width,diemKhoiHanh:'Hà Nội',diemDen:hotel.tinhThanh||'Quảng Ninh',ngayBatDau:date,soNguoi:2,nganSach:5000000,days:[{tieuDe:'Tham quan, ăn uống và nghỉ ngơi',activities},{tieuDe:'Tự do khám phá',ghiChu:'Chi phí di chuyển chưa tính.'}]}});
    assert.equal(create.status(),201,await create.text());const id=(await create.json()).id;trips.push(id);
    const ctx=await browser.newContext({baseURL:'http://localhost:5173',viewport:{width,height:1000},reducedMotion:'reduce'});
    await ctx.addInitScript(s=>localStorage.setItem('tripmate_auth',JSON.stringify(s)),sessions.user);
    const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/planner?edit='+id);
    await expect(page.getByRole('heading',{name:'Dự toán chuyến đi',exact:true})).toBeVisible();
    await expect(page.locator('.event-cost').first()).toContainText('× 2 vé');
    await page.getByRole('button',{name:'Chỉnh sửa hoạt động 1 ngày 1',exact:true}).click();
    await page.locator('dialog[open]').last().locator('[name=quantity]').fill('3');
    await expect(page.getByRole('button',{name:'Lưu hoạt động',exact:true})).toBeEnabled();
    await page.getByRole('button',{name:'Lưu hoạt động',exact:true}).click();
    await expect(page.locator('.event-cost').first()).toContainText('× 3 vé');
    await page.getByRole('button',{name:'Chỉnh sửa hoạt động 3 ngày 1',exact:true}).click();
    await expect(page.locator('dialog[open]').last().locator('[name=roomId]')).toHaveValue(String(room.maLoaiPhong));
    await page.locator('dialog[open]').last().locator('[name=rooms]').fill('100');
    await expect(page.locator('.event-cost').last()).toContainText('Không đủ phòng');
    await page.locator('dialog[open]').last().locator('[name=rooms]').fill('1');
    await expect(page.locator('.event-cost').last()).toContainText('Đủ phòng tại thời điểm kiểm tra');
    const bookLink=page.getByRole('link',{name:'Đặt phòng này (mở tab mới, giữ bản nháp)'});
    await expect(bookLink).toHaveAttribute('target','_blank');
    const bookingUrl=await bookLink.getAttribute('href');
    const booking=await ctx.newPage();await booking.goto(bookingUrl);
    await expect(booking.getByLabel('Ngày nhận phòng',{exact:true})).toHaveValue(date);
    await expect(booking.getByLabel('Số khách',{exact:true})).toHaveValue('2');
    await expect(booking.getByRole('combobox',{name:'Loại phòng',exact:true})).toHaveValue(String(room.maLoaiPhong));
    await booking.close();
    await page.getByRole('button',{name:'Lưu hoạt động',exact:true}).click();
    await page.route('**/api/account/itineraries/estimate',r=>r.abort(),{times:1});
    await page.getByRole('button',{name:'Kiểm tra lại giá và phòng'}).click();
    await expect(page.locator('.planner-ledger [role="alert"]')).toBeVisible();
    await expect(page.getByRole('button',{name:'Lưu lịch trình',exact:true})).toBeDisabled();
    await expect(page.locator('.planner-ledger .cost-grand-total')).toHaveCount(0);
    await page.getByRole('button',{name:'Kiểm tra lại giá và phòng'}).click();
    await expect(page.getByRole('heading',{name:'Dự toán chuyến đi',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Chỉnh sửa hoạt động 1 ngày 1',exact:true}).focus();await page.keyboard.press('Tab');
    assert(await page.evaluate(()=>!!document.activeElement?.matches('input,select,button,a,summary')));
    const overflow=await page.locator('main').evaluate(el=>el.scrollWidth>el.clientWidth+2);assert.equal(overflow,false);
    // Capture actual viewport states; scroll container is the app's main, not the document.
    await page.locator('main').evaluate(el=>el.scrollTop=0);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(review,`planner-top-${width}.png`)});
    await page.locator('.event-timeline > li').last().scrollIntoViewIfNeeded();
    if(width===1440){
      const saveBox=await page.getByRole('button',{name:'Lưu lịch trình',exact:true}).boundingBox();
      assert(saveBox&&saveBox.y>=92&&saveBox.y+saveBox.height<=1000,'Save stays in desktop viewport with warning-rich quote');
    }
    await page.screenshot({path:path.join(review,`planner-room-${width}.png`)});
    // Expanded capture for the complete page, plus unmodified viewport evidence above.
    const style=await page.addStyleTag({content:'.user-page { height:auto !important; overflow:visible !important; } .planner-ledger { position:static !important; }'});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(review,`planner-full-${width}.png`),fullPage:true});
    await style.evaluate(el=>el.remove());
    await page.getByRole('button',{name:'Lưu lịch trình',exact:true}).click();
    await expect(page).toHaveURL(new RegExp('tab=trips&trip='+id));
    await expect(page.getByRole('heading',{name:'Dự toán khi lưu'})).toBeVisible();
    await page.reload();await expect(page.locator('.account-trip-detail .event-cost').first()).toContainText('× 3 vé');
    await page.locator('.account-trip-detail .cost-ledger').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(review,`saved-${width}.png`)});
    checks.push(`${width}: estimate refresh, quantities, unavailable/capacity, retry, no stale totals, room booking prefill, keyboard, save/reload`);
    if(width===1440){
      const account=await (await api.get('/api/account',{headers})).json();
      const saved=account.trips.find(t=>t.maChuyenDi===id);
      const update=await api.put('/api/account/itineraries/'+id,{headers,data:{tenChuyenDi:tag+'-'+width,diemKhoiHanh:'Hà Nội',diemDen:hotel.tinhThanh||'Quảng Ninh',ngayBatDau:date,soNguoi:2,nganSach:5000000,revision:saved.revision,days:Array.from({length:30},(_,i)=>({tieuDe:'Ngày '+(i+1),activities:i===0?activities:[]}))}});
      assert.equal(update.status(),200,await update.text());
      await page.goto('/planner?edit='+id);await expect(page.getByRole('heading',{name:'Dự toán chuyến đi',exact:true})).toBeVisible();
      await page.locator('.planner-day').nth(1).scrollIntoViewIfNeeded();
      const saveBox=await page.getByRole('button',{name:'Lưu lịch trình',exact:true}).boundingBox();
      assert(saveBox&&saveBox.y>=92&&saveBox.y+saveBox.height<=1000,'Save remains visible with 30 daily quote rows');
      const ledger=page.getByLabel('Chi tiết dự toán có thể cuộn',{exact:true});
      await ledger.focus();await page.keyboard.press('End');
      await expect.poll(()=>ledger.evaluate(el=>el.scrollTop),{message:'Keyboard can scroll long cost breakdown'}).toBeGreaterThan(0);
      await page.screenshot({path:path.join(review,'planner-long-1440.png')});
      checks.push('1440: warning-rich and 30-day ledger keep Save visible; keyboard scroll works');
    }
    await ctx.close();
    // Existing orders, read-only; preserve full-card service navigation.
    const adminContext=await browser.newContext({baseURL:'http://localhost:5173',viewport:{width,height:1000},reducedMotion:'reduce'});
    await adminContext.addInitScript(s=>localStorage.setItem('tripmate_auth',JSON.stringify(s)),sessions.user);
    const orders=await adminContext.newPage();orders.on('pageerror',e=>errors.push(e.message));
    for(const kind of ['hotels','tours']){
      const loaded=orders.waitForResponse(r=>r.url().endsWith('/api/account')&&r.status()===200);
      await orders.goto('/account?tab='+kind);await loaded;
      const info=orders.locator('.booking-information').first();
      await expect(info).toBeVisible();
      await info.locator('summary').click();await expect(info.getByText('Đơn giá lúc đặt',{exact:true})).toBeVisible();
      await expect(info.getByText('Tổng tiền đơn',{exact:true})).toBeVisible();
      await expect(info.locator('[role="status"]')).toHaveCount(0);
      await info.scrollIntoViewIfNeeded();
      await orders.screenshot({path:path.join(review,`booking-${kind}-${width}.png`)});
      assert.equal(await orders.locator('main').evaluate(el=>el.scrollWidth>el.clientWidth+2),false);
      checks.push(`${width} ${kind}: historical price, dates, payment and service link`);
    }
    await adminContext.close();
  }
  assert.deepEqual(errors,[]);console.log(checks.join('\n'));console.log('PASS planner UI: no console errors or horizontal overflow.');
}finally{
  for(const id of trips){
    const record=await api.get('/api/chuyendi/'+id,{headers:adminHeaders});
    if(record.ok()&&(await record.json()).tenChuyenDi.startsWith(tag))assert.equal((await api.delete('/api/chuyendi/'+id,{headers:adminHeaders})).ok(),true);
  }
  await browser.close();await api.dispose();console.log('Only tagged UI itineraries removed.');
}
