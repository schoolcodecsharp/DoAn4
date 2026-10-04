// Read-only checks using existing local accounts and their actual bookings/trips.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'frontend/package.json'));
const {chromium,request,expect}=require('@playwright/test');
const accounts=JSON.parse(fs.readFileSync(path.join(root,'.local/test-accounts.json'),'utf8'));
const api=await request.newContext({baseURL:'http://localhost:5173'});
const browser=await chromium.launch();
const checks=[],errors=[],records=[];
try {
  for(const role of ['admin','user']) {
    const auth=await api.post('/api/auth/login',{data:{email:accounts[role].email,matKhau:accounts[role].password}});assert.equal(auth.status(),200);
    const session=await auth.json();
    const response=await api.get('/api/account',{headers:{Authorization:'Bearer '+session.token}});assert.equal(response.status(),200);
    records.push({role,session,data:await response.json()});
  }
  for(const width of [1440,390]) {
    for(const kind of ['hotels','tours','trips']) {
      const record=records.find(r=>r.data[kind].length);
      assert(record,`Existing ${kind} fixture required`);
      const item=record.data[kind][0];
      const ctx=await browser.newContext({baseURL:'http://localhost:5173',viewport:{width,height:1000},reducedMotion:'reduce'});
      await ctx.addInitScript(s=>localStorage.setItem('tripmate_auth',JSON.stringify(s)),record.session);
      const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
      await page.goto('/account?tab='+kind);
      const card=page.locator('.account-record-link').first();
      await expect(card).toBeVisible();
      const target=kind==='hotels'?`/hotels/${item.hotelId}`:kind==='tours'?`/tours/${item.tourId}`:`/account/trips/${item.maChuyenDi}`;
      await expect(card).toHaveAttribute('href',target);
      assert.equal(await card.locator('button,a').count(),0,'No nested controls in card');
      if(width===1440&&kind==='hotels') {
        await card.scrollIntoViewIfNeeded();await card.focus();
        await page.screenshot({path:path.join(root,'.local/account-clickable-desktop.png')});
        await card.press('Enter');
      } else {
        await card.click({position:{x:12,y:12}}); // Blank padding is clickable too.
      }
      await expect(page).toHaveURL('http://localhost:5173'+target);
      if(kind==='hotels') {
        await expect(page.getByRole('heading',{name:'Thông tin giới thiệu',exact:true})).toBeVisible();
        const hotel=await (await api.get('/api/khachsan/'+item.hotelId)).json();
        await expect(page.getByRole('heading',{name:hotel.tenKhachSan,exact:true})).toBeVisible();
        if(hotel.hinhAnh.length)await expect(page.locator('.photo-gallery img').first()).toBeVisible();
        const room=await (await api.get('/api/loaiphong/'+item.roomId)).json();
        assert.equal(room.maKhachSan,item.hotelId);
        await expect(page.getByRole('heading',{name:room.tenLoaiPhong,exact:true})).toBeVisible();
        await expect(page.locator('.option-row').filter({has:page.getByRole('heading',{name:room.tenLoaiPhong,exact:true})}).getByText(`Tối đa ${room.sucChua} khách / phòng`,{exact:true})).toBeVisible();
      } else if(kind==='tours') {
        await expect(page.getByRole('heading',{name:item.name,exact:true})).toBeVisible();
        await expect(page.getByRole('heading',{name:'Thông tin giới thiệu',exact:true})).toBeVisible();
      } else {
        await expect(page.locator('.account-trip-detail')).toBeVisible();
        await expect(page.getByRole('heading',{name:item.tenChuyenDi,exact:true})).toBeVisible();
        assert.equal(await page.locator('.trip-day').count(),item.days.length);
        if(item.days.length)await expect(page.locator('.trip-day').first()).toBeVisible();
        if(item.isOwner) {
          await page.getByRole('button',{name:'Quản lý thành viên',exact:true}).click();
          await page.getByRole('button',{name:'Mời thành viên',exact:true}).click();
          await expect(page.getByLabel('Email thành viên',{exact:true})).toBeVisible();
          await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
          await expect(page).toHaveURL('http://localhost:5173'+target);
        }
      }
      if(kind!=='trips') {
        await expect(page.getByRole('heading',{name:'Đánh giá từ khách đã trải nghiệm',exact:true})).toBeVisible();
        await page.getByRole('button',{name:'Viết bình luận',exact:true}).click();
        await expect(page.getByLabel('Bình luận của bạn',{exact:true})).toBeVisible();
        await page.keyboard.press('Escape');
        const id=kind==='hotels'?item.hotelId:item.tourId;
        const eligibility=await (await api.get(`/api/feedback/${kind}/${id}/eligibility`,{headers:{Authorization:'Bearer '+record.session.token}})).json();
        if(eligibility.canReview) { await page.getByRole('button',{name:'Viết đánh giá',exact:true}).click(); await expect(page.getByRole('radio',{name:'5 sao',exact:true})).toBeVisible(); await page.keyboard.press('Escape'); }
        else {
          await expect(page.getByRole('button',{name:'Gửi đánh giá',exact:true})).toHaveCount(0);
          await expect(page.getByText(eligibility.alreadyReviewed?/Bạn đã đánh giá dịch vụ này/:eligibility.requirement,{exact:!eligibility.alreadyReviewed})).toBeVisible();
        }
        if(kind==='hotels') {await page.locator('#feedback').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,`.local/account-hotel-feedback-${width}.png`)});}
        checks.push(`${width} ${kind}: comments available, star form matches server eligibility`);
      }
      await page.reload();
      await expect(page.locator(kind==='trips'?'.account-trip-detail':'.detail-heading')).toBeVisible();
      assert.equal(await page.locator('main').first().evaluate(el=>el.scrollWidth>el.clientWidth+2),false);
      if(kind==='trips')await page.locator('.account-trip-detail').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(root,`.local/account-${kind}-detail-${width}.png`)});
      await page.goBack();await expect(page).toHaveURL('http://localhost:5173/account?tab='+kind);
      checks.push(`${width} ${kind}: full card, correct target, reload, Back, layout`);
      await ctx.close();
    }
  }
  const page=await browser.newPage({baseURL:'http://localhost:5173'});
  const bookedHotel=records.find(r=>r.data.hotels.length).data.hotels[0];
  await page.goto(`/hotels/${bookedHotel.hotelId}`);
  await expect(page.getByRole('heading',{name:'Đánh giá từ khách đã trải nghiệm',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Đăng nhập để bình luận',exact:true})).toBeVisible();
  checks.push('Hotel feedback is publicly readable without login');
  await page.goto('/account/trips/2147483647');
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  checks.push('Private itinerary requires login');
  await page.addInitScript(s=>localStorage.setItem('tripmate_auth',JSON.stringify(s)),records[1].session);
  await page.goto('/account/trips/2147483647');
  await expect(page.getByRole('alert')).toContainText('Không tìm thấy lịch trình');
  assert.equal(await page.locator('.trip-day').count(),0);
  checks.push('Unknown or inaccessible itinerary reveals no plan');
  const roomRecord=records.find(r=>r.data.hotels.length).data.hotels[0];
  await page.goto(`/hotels/${roomRecord.hotelId}/rooms/2147483647`);
  await expect(page.getByRole('alert')).toBeVisible();
  checks.push('Missing room has recovery state');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({checks,errors},null,2));
} finally {await browser.close();await api.dispose();}
