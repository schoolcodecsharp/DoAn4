// Existing accounts only; exact-tag disposable fixtures, cleaned in finally.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, request, expect } = require('@playwright/test');
const accounts = JSON.parse(fs.readFileSync(path.join(root, '.local/test-accounts.json'), 'utf8'));
const api = await request.newContext({ baseURL: 'http://localhost:5173/api/' });
const direct = await request.newContext({ baseURL: 'http://localhost:5000/api/' });
const browser = await chromium.launch();
const tag = 'feedback-' + Date.now();
const fixture = action => execFileSync('dotnet', ['tests/AdminSmoke/bin/Debug/net9.0/AdminSmoke.dll', '--feedback-fixtures', action, tag], { cwd: root, encoding: 'utf8' });
const sessions = {}, checks = [], errors = [];
let ids, tripId;
const pass = name => { checks.push(name); console.log('PASS:', name); };
async function call(role, method, url, data, status = 200) {
  const response = await api[method](url, { headers: role ? { Authorization: 'Bearer ' + sessions[role].token } : {}, ...(data ? { data } : {}) });
  assert.equal(response.status(), status, `${method} ${url}: ${await response.text()}`);
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}
async function ui(role, width) {
  const ctx = await browser.newContext({ baseURL: 'http://localhost:5173', viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
  if (role) await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), sessions[role]);
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  return { ctx, page };
}
try {
  for (const role of ['admin', 'user']) sessions[role] = await call(null, 'post', 'auth/login', { email: accounts[role].email, matKhau: accounts[role].password });
  ids = JSON.parse(fixture('create').trim());
  await call('user', 'post', `account/bookings/tours/${ids.tourOrder}/cancellation`, { reason: tag }, 409);
  await call('user', 'post', `account/bookings/hotels/${ids.roomOrder}/cancellation`, { reason: tag }, 409);
  fixture('future');
  const tour = await call('admin', 'get', 'tour/' + ids.tour);
  await call('admin', 'put', 'tour/' + ids.tour, { ...tour, soNgay: 2, soDem: 1 }, 409);
  const stops = await call('admin', 'get', 'tourchitiet/bytour/' + ids.tour);
  await call('admin', 'put', 'tourchitiet/' + stops[0].maTourChiTiet, stops[0], 409);
  await call('admin', 'delete', 'tourchitiet/' + stops[0].maTourChiTiet, null, 409);
  await call('admin', 'post', 'tourchitiet', { ...stops[0], thuTu: 2 }, 409);
  pass('Booked tour duration and stop create/update/delete protected');
  await call('admin', 'post', `account/bookings/tours/${ids.tourOrder}/cancellation`, { reason: tag }, 404);
  await call('user', 'put', 'dattour/' + ids.tourOrder, { cancellationDecisionStatus: 'Approved' }, 403);
  const cancellationUrl = `account/bookings/tours/${ids.tourOrder}/cancellation`;
  const requests = await Promise.all([1, 2].map(() => api.post(cancellationUrl, { headers: { Authorization: 'Bearer ' + sessions.user.token }, data: { reason: tag } })));
  assert.deepEqual(requests.map(r => r.status()).sort(), [200, 409]);
  await call('admin', 'put', 'dattour/' + ids.tourOrder, { trangThai: 'Confirmed' }, 409);
  assert.equal((await call('admin', 'get', 'dattour/' + ids.tourOrder)).trangThai, 'Pending');
  pass('Owner-only cancellation; duplicate serialized; request keeps reservation');
  const start = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  const places = await call(null, 'get', 'diadiem');
  const place = places.find(p => p.trangThai && p.hinhAnh?.length);
  assert(place);
  const activity = { loaiDiaDiem: 'DiaDiem', maDoiTuong: place.maDiaDiem, thoiGianBatDau: '08:00:00', thoiGianKetThuc: '10:00:00', ghiChu: tag };
  const plan = { tenChuyenDi: tag, diemKhoiHanh: 'Hà Nội', diemDen: 'Quảng Ninh', ngayBatDau: start, soNguoi: 2, nganSach: 1000, moTa: tag, days: [{ tieuDe: 'Ngày khám phá', ghiChu: tag, activities: [activity] }] };
  tripId = (await call('user', 'post', 'account/itineraries', plan, 201)).id;
  await call('admin', 'put', 'account/itineraries/' + tripId, { ...plan, revision: 0 }, 404);
  await call('user', 'put', 'account/itineraries/' + tripId, { ...plan, revision: 0, days: [{ ...plan.days[0], activities: [activity, activity] }] }, 400);
  const writes = await Promise.all([1, 2].map(() => api.put('account/itineraries/' + tripId, { headers: { Authorization: 'Bearer ' + sessions.user.token }, data: { ...plan, revision: 0 } })));
  assert.deepEqual(writes.map(r => r.status()).sort(), [200, 409]);
  const saved = (await call('user', 'get', 'account')).trips.find(t => t.maChuyenDi === tripId);
  assert.equal(saved.revision, 1); assert.equal(saved.days[0].activities.length, 1); assert(saved.days[0].activities[0].hinhAnh.length);
  pass('Atomic itinerary edit: ownership, overlap, concurrent version, preserved photo');
  for (const width of [1440, 390]) {
    for (const role of ['admin', 'user', null]) {
      const { ctx, page } = await ui(role, width); await page.goto('/');
      if (role === 'admin') {
        const adminLink = page.locator('header').getByRole('link', { name: 'Quản trị', exact: true });
        await expect(adminLink).toBeVisible(); await adminLink.focus();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.screenshot({ path: path.join(root, `.local/admin-home-${width}.png`) });
        await adminLink.press('Enter'); await expect(page).toHaveURL(/\/admin/);
        await page.goto('/admin/tour-orders');
        await expect(page.locator('.cancellation-review').filter({ hasText: `#${ids.tourOrder}` })).toBeVisible();
        await page.screenshot({ path: path.join(root, `.local/admin-cancel-${width}.png`) });
      } else await expect(page.locator('header .travel-admin')).toHaveCount(0);
      await ctx.close();
    }
    const { ctx, page } = await ui('user', width);
    await page.goto('/account?tab=tours');
    const card = page.locator('.account-booking').filter({ has: page.getByRole('heading', { name: tag, exact: true }) });
    await expect(card.getByText('Yêu cầu hủy đang chờ admin duyệt', { exact: true })).toBeVisible();
    assert.equal(await card.locator('a button,a a').count(), 0);
    await page.goto('/account?tab=hotels');
    const stayCard = page.locator('.account-booking').filter({ hasText: tag });
    await stayCard.getByText('Yêu cầu hủy đơn', { exact: true }).click();
    await stayCard.getByLabel(/Lý do hủy đơn/).fill(tag);
    await page.screenshot({ path: path.join(root, `.local/customer-cancel-${width}.png`) });
    if (width === 390) {
      await stayCard.getByRole('button', { name: 'Gửi yêu cầu hủy', exact: true }).click();
      await expect(stayCard.getByText('Yêu cầu hủy đang chờ admin duyệt', { exact: true })).toBeVisible();
    }
    await page.goto('/account/trips/' + tripId); await page.getByRole('link', { name: 'Sửa lịch trình', exact: true }).click();
    await expect(page.getByLabel('Tên chuyến đi', { exact: true })).toHaveValue(tag);
    await expect(page.locator('.planner-event img').first()).toBeVisible().catch(async () => { await expect(page.locator('.planner-day img').first()).toBeVisible(); });
    await page.getByLabel(/Ghi chú chung/).fill(tag + ' updated ' + width);
    await page.getByRole('button', { name: 'Lưu lịch trình', exact: true }).click();
    await expect(page.locator('.account-trip-detail')).toBeVisible(); await expect(page.getByText(tag + ' updated ' + width, { exact: true })).toBeVisible();
    await page.screenshot({ path: path.join(root, `.local/edited-plan-${width}.png`) });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await ctx.close();
    pass(`${width}px header role visibility, admin navigation/review, clickable card and saved-plan editing`);
  }
  const { ctx: adminCtx, page: adminPage } = await ui('admin', 1440);
  await adminPage.goto('/admin'); await adminPage.getByRole('link', { name: /Đơn.*tour/i }).first().click();
  const panel = adminPage.locator('.cancellation-review').filter({ hasText: `#${ids.tourOrder}` });
  await panel.getByLabel('Phản hồi cho khách').fill('Đã duyệt yêu cầu'); await panel.getByRole('button', { name: 'Lưu quyết định' }).click(); await expect(panel).toHaveCount(0); await adminCtx.close();
  const cancelled = await call('admin', 'get', 'dattour/' + ids.tourOrder);
  assert.equal(cancelled.trangThai, 'Cancelled'); assert.equal(cancelled.yeuCauHuy, 'Approved');
  assert.equal((await call('admin', 'get', 'tourkhoihanh/' + ids.departure)).soChoDaDat, 0);
  await call('admin', 'put', 'dattour/' + ids.tourOrder, { cancellationDecisionStatus: 'Approved' }, 409);
  pass('Admin UI approves once; tour inventory released exactly once');
  const payment = await call('admin', 'post', 'thanhtoan', { loaiDon: 'DatPhong', maDatPhong: ids.roomOrder, soTien: 100, phuongThuc: 'TienMat', maGiaoDich: tag }, 201);
  await call('admin', 'put', 'thanhtoan/' + payment.id, { trangThai: 'ThanhCong' }, 204);
  await call('user', 'post', `account/bookings/hotels/${ids.roomOrder}/cancellation`, { reason: tag }, 409);
  await call('admin', 'put', 'datphong/' + ids.roomOrder, { cancellationDecisionStatus: 'Approved' }, 409);
  const paid = (await call('user', 'get', 'account')).hotels.find(b => b.id === ids.roomOrder);
  assert.equal(paid.paid, 100); assert.equal(paid.cancellationStatus, 'Pending');
  await call('admin', 'put', 'datphong/' + ids.roomOrder, { cancellationDecisionStatus: 'Rejected', cancellationReply: 'Chưa hỗ trợ hoàn tiền; liên hệ quản trị để xử lý.' }, 204);
  assert.equal((await call('admin', 'get', 'datphong/' + ids.roomOrder)).trangThai, 'Pending');
  pass('Paid cancellation blocked atomically; rejection preserves booking; account paid total correct');
  const extraRoom = (await call('user', 'post', 'account/bookings/hotels', { maLoaiPhong: ids.room, ngayNhanPhong: start, ngayTraPhong: new Date(Date.parse(start) + 86400000).toISOString().slice(0, 10), soLuongPhong: 1, soNguoi: 1, ghiChu: tag }, 201)).id;
  await call('user', 'post', `account/bookings/hotels/${extraRoom}/cancellation`, { reason: tag });
  const concurrentPayment = (await call('admin', 'post', 'thanhtoan', { loaiDon: 'DatPhong', maDatPhong: extraRoom, soTien: 100, phuongThuc: 'TienMat', maGiaoDich: tag + '-race' }, 201)).id;
  const outcomes = await Promise.all([
    api.put('datphong/' + extraRoom, { headers: { Authorization: 'Bearer ' + sessions.admin.token }, data: { cancellationDecisionStatus: 'Approved' } }),
    api.put('thanhtoan/' + concurrentPayment, { headers: { Authorization: 'Bearer ' + sessions.admin.token }, data: { trangThai: 'ThanhCong' } })
  ]);
  assert.deepEqual(outcomes.map(r => r.status()).sort(), [204, 409]);
  const orderState = await call('admin', 'get', 'datphong/' + extraRoom);
  const payState = await call('admin', 'get', 'thanhtoan/' + concurrentPayment);
  assert(!(orderState.trangThai === 'Cancelled' && payState.trangThai === 'ThanhCong'));
  pass('Payment versus cancellation race cannot produce paid-and-cancelled order');
  const allowed = await direct.get('health', { headers: { Origin: 'http://localhost:5173' } });
  const denied = await direct.get('health', { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(allowed.headers()['access-control-allow-origin'], 'http://localhost:5173'); assert(!denied.headers()['access-control-allow-origin']);
  pass('CORS allowlist excludes untrusted origin');
  assert.deepEqual(errors, []); pass('No browser runtime errors');
} finally {
  if (tripId && sessions.admin) {
    const trip = await call('admin', 'get', 'chuyendi/' + tripId);
    assert.equal(trip.tenChuyenDi, tag); await call('admin', 'delete', 'chuyendi/' + tripId);
  }
  if (ids) console.log(fixture('cleanup').trim());
  await browser.close(); await api.dispose(); await direct.dispose();
}
console.log(`${checks.length} grouped workflow checks passed.`);
