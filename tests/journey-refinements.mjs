// Read-only DB test: existing SQL login + estimates. Save/error responses are browser-only mocks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, request, expect } = require('@playwright/test');
const client = await request.newContext({ baseURL: 'http://127.0.0.1:5173' });
const accounts = JSON.parse(fs.readFileSync(path.join(root, '.local/test-accounts.json'), 'utf8'));
const login = await client.post('/api/auth/login', { data: { email: accounts.user.email, matKhau: accounts.user.password } });
assert.equal(login.status(), 200);
const session = await login.json();
const get = async p => { const r = await client.get('/api/' + p); assert.equal(r.status(), 200, p); return r.json(); };
const inventory = await get('catalog-availability');
assert(inventory.hotels.length && inventory.tours.length);
const hotelId = inventory.hotels[0], tourId = inventory.tours[0];
const room = (await get('loaiphong/bykhachsan/' + hotelId)).find(r => r.trangThai && r.soLuongPhong > 0);
const tour = await get('tour/' + tourId);
const browser = await chromium.launch();
const errors = [], checks = [];
const output = path.join(root, '.impeccable/review/journey');
fs.mkdirSync(output, { recursive: true });
try {
  for (const width of [1440, 390, 320]) {
    const ctx = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce', baseURL: 'http://127.0.0.1:5173' });
    await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), session);
    // Safety: never submit an actual booking, trip or admin mutation in this suite.
    await ctx.route('**/api/**', async route => {
      const req = route.request(), url = new URL(req.url());
      if (!['GET', 'HEAD'].includes(req.method()) && !url.pathname.endsWith('/itineraries/estimate')) return route.fulfill({ status: 503, json: { message: 'Test safety: write blocked' } });
      return route.continue();
    });
    const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto('/tours?keyword=' + encodeURIComponent(tour.tenTour) + '&sort=name');
    const card = page.locator('.catalog-card').first(); await expect(card).toBeVisible();
    await card.getByRole('link', { name: 'Xem chi tiết', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Lịch khởi hành', exact: true })).toBeVisible();
    assert(await page.getByRole('heading', { name: 'Lịch khởi hành', exact: true }).evaluate(el => !!(el.compareDocumentPosition(document.querySelector('.tour-schedule')) & Node.DOCUMENT_POSITION_FOLLOWING)));
    await page.getByRole('link', { name: 'Trở lại tour du lịch' }).click();
    await expect(page).toHaveURL(/sort=name/);
    await expect(page.getByLabel('Bạn muốn đến đâu?')).toHaveValue(tour.tenTour);
    await page.goto('/hotels?availability=bookable');
    await expect(page.locator('.catalog-card').first()).toBeVisible();
    assert.equal(await page.getByText('Tham khảo · chưa có lựa chọn đặt', { exact: true }).count(), 0);
    await page.screenshot({ path: path.join(output, `catalog-${width}.png`), fullPage: true });
    await page.goto(`/hotels/${hotelId}/book?room=${room.maLoaiPhong}&checkin=2027-11-01&checkout=2027-11-03`);
    const confirmation = page.locator('.booking-confirmation');
    await expect(confirmation).toContainText(/Còn \d+ phòng/);
    await expect(confirmation).toContainText('2 đêm');
    const submit = page.getByRole('button', { name: 'Xác nhận yêu cầu đặt chỗ', exact: true });
    await expect(submit).toBeEnabled();
    assert(await confirmation.evaluate(el => !!(el.compareDocumentPosition(el.parentElement.querySelector('button[type=submit]')) & Node.DOCUMENT_POSITION_FOLLOWING)));
    await page.locator('[name=ngayTraPhong]').fill('2027-11-01');
    await submit.click();
    await expect(page.locator('[name=ngayTraPhong]')).toHaveAttribute('aria-invalid', 'true');
    await expect(confirmation).not.toContainText(/Còn \d+ phòng/);
    await page.locator('[name=ngayTraPhong]').fill('2027-11-03');
    await expect(submit).toBeEnabled();
    await page.screenshot({ path: path.join(output, `booking-${width}.png`), fullPage: true });
    await confirmation.screenshot({ path: path.join(output, `confirmation-${width}.png`) });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `booking overflow ${width}`);

    await page.goto('/planner');
    const name = page.getByLabel('Tên chuyến đi', { exact: true });
    await name.fill('Bản nháp kiểm thử — không ghi SQL');
    await page.getByRole('button', { name: 'Chỉnh sửa ngày 1', exact: true }).click();
    await page.getByLabel('Tiêu đề ngày', { exact: true }).fill('Ngày khám phá');
    await page.getByRole('button', { name: 'Lưu ngày vào bản nháp', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu nháp' })).toBeVisible();
    page.on('dialog', async d => d.accept());
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Bạn có một bản nháp chưa lưu' })).toBeVisible();
    await expect(name).toBeDisabled();
    await page.getByRole('button', { name: 'Khôi phục bản nháp' }).click();
    await expect(name).toHaveValue('Bản nháp kiểm thử — không ghi SQL');
    await expect(page.getByRole('heading', { name: 'Ngày khám phá', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lưu lịch trình', exact: true })).toBeEnabled();
    await page.screenshot({ path: path.join(output, `planner-${width}.png`), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `planner overflow ${width}`);
    await page.reload();
    await page.getByRole('button', { name: 'Bỏ bản nháp' }).click();
    await expect(name).toHaveValue('');
    assert.equal(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('nvt:planner:')).length), 0);
    checks.push(`${width}px: catalog/back/filter, dated room quote, price before submit, draft restore/discard, overflow`);
    await ctx.close();
  }
  // Controlled catalog fixture verifies the free-vs-unknown contract without modifying SQL.
  const page = await browser.newPage({ baseURL: 'http://127.0.0.1:5173' });
  await page.route('**/api/diadiem', route => route.fulfill({ json: [
    { maDiaDiem: 9001, tenDiaDiem: 'Điểm miễn phí kiểm thử', trangThai: true, mienPhi: true, giaVe: 0 },
    { maDiaDiem: 9002, tenDiaDiem: 'Điểm chưa có giá kiểm thử', trangThai: true, mienPhi: false, giaVe: 0 },
    { maDiaDiem: 9003, tenDiaDiem: 'Điểm có vé kiểm thử', trangThai: true, mienPhi: false, giaVe: 100000 },
  ] }));
  await page.goto('/destinations?maxPrice=200000&sort=price-asc');
  await expect(page.locator('.catalog-card')).toHaveCount(2);
  await expect(page.locator('.catalog-card').first()).toContainText('Miễn phí vé vào cửa');
  await expect(page.locator('.catalog-card').first()).toContainText('Điểm miễn phí kiểm thử');
  checks.push('Free admission included in maximum-budget filter and sorted as known zero, unknown excluded');
  await page.close();
  const ctx = await browser.newContext({ baseURL: 'http://127.0.0.1:5173', reducedMotion: 'reduce' });
  await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), session);
  const edge = await ctx.newPage(); edge.on('pageerror', e => errors.push(e.message));
  edge.on('dialog', d => d.accept());
  const draftKey = `nvt:planner:v1:${session.user.maNguoiDung}:new`;
  await edge.goto('/planner');
  const fill = async () => {
    await edge.getByLabel('Tên chuyến đi', { exact: true }).fill('Kiểm thử lưu bản nháp');
    await edge.getByLabel('Khởi hành từ', { exact: true }).fill('Hà Nội');
    await edge.getByLabel('Điểm đến tại Việt Nam', { exact: true }).fill('Hà Nội');
    await edge.getByRole('button', { name: 'Chỉnh sửa ngày 1', exact: true }).click();
    await edge.getByLabel('Tiêu đề ngày', { exact: true }).fill('Khám phá');
    await edge.getByRole('button', { name: 'Lưu ngày vào bản nháp', exact: true }).click();
    await expect(edge.getByRole('button', { name: 'Lưu lịch trình', exact: true })).toBeEnabled();
  };
  await fill();
  const stored = await edge.evaluate(k => localStorage.getItem(k), draftKey);
  assert(stored);
  // Another account's draft does not appear; malformed own draft never crashes the editor.
  await edge.evaluate(({ k, value }) => { localStorage.removeItem(k); localStorage.setItem('nvt:planner:v1:999999:new', value); }, { k: draftKey, value: stored });
  await edge.reload();
  await expect(edge.getByRole('dialog', { name: 'Tạo lịch trình mới' })).toBeVisible();
  await expect(edge.getByRole('heading', { name: 'Bạn có một bản nháp chưa lưu' })).toHaveCount(0);
  await edge.evaluate(k => localStorage.setItem(k, '{broken'), draftKey);
  await edge.reload();
  await expect(edge.getByRole('status').filter({ hasText: 'Không đọc được bản nháp' })).toBeVisible();
  await fill();
  // Simulated server failure then success: no real itinerary is inserted.
  await edge.route('**/api/account/itineraries', r => r.fulfill({ status: 409, json: { message: 'Lịch trình đã thay đổi. Vui lòng tải lại.' } }));
  await edge.getByRole('button', { name: 'Lưu lịch trình', exact: true }).click();
  await expect(edge.getByRole('alert').filter({ hasText: 'Lịch trình đã thay đổi' })).toBeVisible();
  assert(await edge.evaluate(k => !!localStorage.getItem(k), draftKey));
  await edge.unroute('**/api/account/itineraries');
  await edge.route('**/api/account/itineraries', async r => {
    const payload = r.request().postDataJSON(); assert.equal(payload.tenChuyenDi, 'Kiểm thử lưu bản nháp');
    await r.fulfill({ status: 200, json: { id: 999999 } });
  });
  await edge.getByRole('button', { name: 'Lưu lịch trình', exact: true }).click();
  await expect(edge).toHaveURL(/account\?tab=trips&trip=999999/);
  assert.equal(await edge.evaluate(k => localStorage.getItem(k), draftKey), null);
  checks.push('Draft account isolation, malformed storage recovery, save conflict retains draft, simulated success clears draft');
  // No-stock and failed quote must disable booking; previous successful quotes cannot be reused.
  await edge.goto(`/hotels/${hotelId}/book?room=${room.maLoaiPhong}&checkin=2027-11-01&checkout=2027-11-03`);
  const book = edge.getByRole('button', { name: 'Xác nhận yêu cầu đặt chỗ', exact: true });
  await expect(book).toBeEnabled();
  await edge.route('**/api/account/itineraries/estimate', r => r.fulfill({ json: { days: [[{ available: false, availableRooms: 0, minTotal: 5000000, message: 'Không đủ phòng trong khoảng ngày này.' }]] } }));
  await edge.getByLabel('Ngày trả phòng', { exact: true }).fill('2027-11-04');
  await book.click();
  await expect(edge.locator('[name=soLuongPhong]')).toHaveAttribute('aria-invalid', 'true');
  await expect(edge.locator('.booking-confirmation')).toContainText('Không đủ phòng');
  await edge.unroute('**/api/account/itineraries/estimate');
  await edge.route('**/api/account/itineraries/estimate', r => r.fulfill({ status: 503, json: { message: 'Chưa kết nối được phòng trống.' } }));
  await edge.getByRole('button', { name: 'Kiểm tra lại phòng', exact: true }).click();
  await expect(edge.getByRole('alert').filter({hasText:'Chưa kết nối được phòng trống.'})).toBeVisible();
  await expect(book).toBeDisabled();
  checks.push('Room quote no-stock and failure disable submit; stale successful quote is removed');
  await ctx.close();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks, pageErrors: errors, databaseWrites: 0 }, null, 2));
} finally { await browser.close(); await client.dispose(); }
