// Existing SQL accounts only; creates disposable trips and one tour activity.
// Run: node tests/restaurant-planner.mjs (frontend 5173, backend 5000 running).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, request, expect } = require('@playwright/test');
const accounts = JSON.parse(fs.readFileSync(path.join(root, '.local/test-accounts.json'), 'utf8'));
const api = await request.newContext({ baseURL: 'http://localhost:5173' });
const tag = 'Planner check ' + Date.now();
const trips = []; const activities = []; const checks = [];
const check = (label, condition) => { assert.ok(condition, label); checks.push(label); };
const login = async role => {
  const r = await api.post('/api/auth/login', { data: { email: accounts[role].email, matKhau: accounts[role].password } });
  assert.equal(r.status(), 200, 'existing SQL login'); return r.json();
};
const user = await login('user'), admin = await login('admin');
const headers = { Authorization: 'Bearer ' + user.token }, adminHeaders = { Authorization: 'Bearer ' + admin.token };
const browser = await chromium.launch();
const errors = []; const layout = [];
try {
  const restaurants = await (await api.get('/api/nhahang')).json();
  const hotels = await (await api.get('/api/khachsan')).json();
  const destinations = await (await api.get('/api/diadiem')).json();
  const restaurant = restaurants.find(p => p.trangThai && p.hinhAnh?.length);
  const hotel = hotels.find(p => p.trangThai && p.hinhAnh?.length);
  const destination = destinations.find(p => p.trangThai && p.hinhAnh?.length);
  check('Public restaurants include images', !!restaurant);
  const event = (type, id, start, end, note) => ({ loaiDiaDiem: type, maDoiTuong: id, thoiGianBatDau: start + ':00', thoiGianKetThuc: end + ':00', ghiChu: note });
  const events = [event('NhaHang', restaurant.maNhaHang, '11:00', '12:00', 'Ăn trưa'), event('KhachSan', hotel.maKhachSan, '08:00', '10:00', 'Nhận phòng'), event('DiaDiem', destination.maDiaDiem, '13:00', '15:00', 'Tham quan')];
  const payload = { tenChuyenDi: tag, diemKhoiHanh: 'Hà Nội', diemDen: 'Quảng Ninh', ngayBatDau: '2027-01-10', soNguoi: 2, nganSach: 1000000, days: [{ tieuDe: 'Ngày nhiều hoạt động', activities: events }, { tieuDe: 'Ngày ghi chú cũ', ghiChu: 'Tự do' }] };
  check('Guest cannot save', (await api.post('/api/account/itineraries', { data: payload })).status() === 401);
  const created = await api.post('/api/account/itineraries', { headers, data: payload });
  assert.equal(created.status(), 201, await created.text());
  const id = (await created.json()).id; trips.push(id);
  const account = await (await api.get('/api/account', { headers })).json();
  const trip = account.trips.find(t => t.maChuyenDi === id);
  check('Three activities persisted chronologically', trip.days[0].activities.map(a => a.loaiDiaDiem).join(',') === 'KhachSan,NhaHang,DiaDiem');
  check('All saved activities include their images', trip.days[0].activities.every(a => a.hinhAnh.length && a.tenDiaDiem));
  check('Legacy notes-only day still works', trip.days[1].activities.length === 0);
  const other = await (await api.get('/api/account', { headers: adminHeaders })).json();
  check('Another account cannot see private trip', !other.trips.some(t => t.maChuyenDi === id));
  for (const [label, changed] of [
    ['Overlap rejected', [events[0], { ...events[1], thoiGianKetThuc: '11:30:00' }]],
    ['Reversed time rejected', [{ ...events[0], thoiGianKetThuc: '10:00:00' }]],
    ['Missing time rejected', [{ ...events[0], thoiGianBatDau: null }]],
    ['Invalid target rejected', [{ ...events[0], maDoiTuong: 2147483647 }]],
    ['Invalid type rejected', [{ ...events[0], loaiDiaDiem: 'Tour' }]],
    ['Twenty-event limit enforced', Array(21).fill(events[0])],
  ]) {
    const response = await api.post('/api/account/itineraries', { headers, data: { ...payload, days: [{ tieuDe: label, activities: changed }] } });
    check(label, response.status() === 400);
  }
  const after = await (await api.get('/api/account', { headers })).json();
  check('Invalid requests leave no partial trips', after.trips.filter(t => t.tenChuyenDi === tag).length === 1);
  check('Customer cannot manage restaurants', (await api.post('/api/nhahang', { headers, data: { tenNhaHang: tag } })).status() === 403);
  const context = await browser.newContext({ baseURL: 'http://localhost:5173', viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), user);
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.route('https://provinces.open-api.vn/**', r => r.fulfill({ json: [{ code: 22, name: 'Tỉnh Quảng Ninh' }] }));
  await page.goto(`/planner?destination=Quảng%20Ninh&restaurant=${restaurant.maNhaHang}`);
  await expect(page.locator('.event-timeline').getByRole('heading', { name: restaurant.tenNhaHang })).toBeVisible();
  await page.getByLabel('Tên chuyến đi', { exact: true }).fill(tag + ' UI');
  await page.getByLabel('Khởi hành từ', { exact: true }).fill('Hà Nội');
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Nhận phòng và ăn trưa');
  await page.getByLabel('Giờ bắt đầu hoạt động 1 ngày 1').fill('11:00');
  await page.getByLabel('Giờ kết thúc hoạt động 1 ngày 1').fill('12:00');
  await page.getByLabel('Nội dung hoạt động 1 ngày 1').fill('Ăn trưa');
  await page.locator('.event-picker summary').click();
  await page.getByRole('button', { name: 'Khách sạn', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm ' + hotel.tenKhachSan, exact: true }).click();
  await page.getByLabel('Giờ bắt đầu hoạt động 2 ngày 1').fill('08:00');
  await page.getByLabel('Giờ kết thúc hoạt động 2 ngày 1').fill('10:00');
  await page.getByLabel('Nội dung hoạt động 2 ngày 1').fill('Nhận phòng');
  await page.getByLabel('Giờ kết thúc hoạt động 2 ngày 1').fill('11:30');
  await expect(page.locator('.event-error')).toContainText('trùng giờ');
  await page.getByLabel('Giờ kết thúc hoạt động 2 ngày 1').fill('10:00');
  check('Selected venue photos displayed', await page.locator('.event-timeline img').count() === 2);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(async () => { await Promise.all(document.getAnimations().filter(a => a.effect?.target?.classList?.contains('route-curtain')).map(a => a.finished)); });
    await page.locator('.day-events h3').evaluate(el => el.scrollIntoView({ block: 'start' }));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    layout.push({ route: 'planner', width, overflow });
    await page.screenshot({ path: path.join(root, `.local/planner-events-${width}.jpg`), quality: 60 });
  }
  const savedResponse = page.waitForResponse(r => r.url().endsWith('/api/account/itineraries') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Lưu lịch trình', exact: true }).click();
  const saved = await savedResponse; assert.equal(saved.status(), 201, await saved.text());
  const uiId = (await saved.json()).id; trips.push(uiId);
  await expect(page).toHaveURL(new RegExp('tab=trips&trip=' + uiId));
  await page.reload();
  const record = page.locator('article.user-panel').filter({ has: page.getByRole('heading', { name: tag + ' UI', exact: true }) });
  await expect(record.getByText('08:00 – 10:00', { exact: true })).toBeVisible();
  await expect(record.getByRole('link', { name: restaurant.tenNhaHang })).toBeVisible();
  check('UI save survives reload with images', await record.locator('.event-timeline img').count() === 2);
  for (const route of ['/restaurants', `/restaurants/${restaurant.maNhaHang}`]) {
    await page.goto(route); await expect(page.locator('h1')).toBeVisible();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      layout.push({ route, width, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1) });
    }
  }
  const adminContext = await browser.newContext({ baseURL: 'http://localhost:5173' });
  await adminContext.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), admin);
  const adminPage = await adminContext.newPage(); adminPage.on('pageerror', e => errors.push(e.message));
  await adminPage.goto('/admin/restaurants');
  await adminPage.getByRole('row').filter({ hasText: restaurant.tenNhaHang }).getByRole('button', { name: 'Chỉnh sửa' }).click();
  await expect(adminPage.getByText('Bộ ảnh', { exact: false }).first()).toBeVisible();
  check('Admin restaurant image manager available', true);
  const tours = await (await api.get('/api/tour', { headers: adminHeaders })).json();
  const tour = tours.find(t => t.trangThai === 'Active');
  await adminPage.goto('/admin/tours');
  await adminPage.getByLabel('Tìm trong danh sách', { exact: true }).fill(tour.tenTour);
  await adminPage.getByRole('row').filter({ hasText: tour.tenTour }).getByRole('button', { name: 'Chỉnh sửa' }).first().click();
  const child = adminPage.locator('.admin-tour-children');
  await child.getByRole('button', { name: '+ Thêm mới', exact: true }).click();
  await child.getByLabel('Loại hoạt động').selectOption('NhaHang');
  await child.getByLabel('Nhà hàng', { exact: true }).selectOption(String(restaurant.maNhaHang));
  await expect(child.locator('.admin-lookup-photo img')).toBeVisible();
  await child.getByLabel('Thứ tự trong ngày').fill('99');
  await child.getByLabel('Giờ bắt đầu').fill('11:00');
  await child.getByLabel('Giờ kết thúc').fill('12:00');
  await child.getByLabel('Mô tả hoạt động (tối đa 500 ký tự)').fill(tag);
  const activityResponse = adminPage.waitForResponse(r => r.url().endsWith('/api/tourchitiet') && r.request().method() === 'POST');
  await child.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
  const activity = await activityResponse;
  assert.equal(activity.status(), 201, await activity.text());
  const activityId = (await activity.json()).maTourChiTiet; activities.push(activityId);
  check('Admin adds a restaurant to tour with image preview', true);
  const schedule = await (await api.get(`/api/tourchitiet/bytour/${tour.maTour}`)).json();
  check('Tour restaurant activity exposes image', schedule.find(a => a.maTourChiTiet === activityId).hinhAnh.length > 0);
  await page.goto(`/tours/${tour.maTour}`);
  const stop = page.locator('.schedule-activity').filter({ hasText: tag });
  await expect(stop.getByRole('link', { name: /Khám phá điểm dừng/ })).toHaveAttribute('href', `/restaurants/${restaurant.maNhaHang}`);
  check('Tour restaurant detail link works', true);
  check('No browser page errors', errors.length === 0);
  check('Desktop and mobile have no horizontal overflow', layout.every(p => !p.overflow));
  console.log(JSON.stringify({ checks, layout, errors }, null, 2));
} finally {
  for (const id of activities) assert.ok((await api.delete('/api/tourchitiet/' + id, { headers: adminHeaders })).ok(), 'Cleanup own tour activity');
  for (const id of trips) assert.ok((await api.delete('/api/chuyendi/' + id, { headers: adminHeaders })).ok(), 'Cleanup own trip');
  console.log('Removed test-created records only:', { trips: trips.length, activities: activities.length });
  await browser.close(); await api.dispose();
}
