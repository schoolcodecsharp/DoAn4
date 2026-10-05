// Existing SQL accounts and read-only GET/estimate calls; ALL mutations are intercepted in-browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, request, expect } = require('@playwright/test');
const baseURL = process.env.UI_BASE_URL || 'http://127.0.0.1:5173';
const client = await request.newContext({ baseURL });
const accounts = JSON.parse(fs.readFileSync(path.join(root, '.local/test-accounts.json'), 'utf8'));
const sessions = {};
for (const role of ['admin', 'user']) {
  const r = await client.post('/api/auth/login', { data: { email: accounts[role].email, matKhau: accounts[role].password } });
  assert.equal(r.status(), 200, `Existing ${role} login`); sessions[role] = await r.json();
}
const get = async (url, role = 'admin') => { const r = await client.get('/api/' + url, { headers: { Authorization: 'Bearer ' + sessions[role].token } }); assert.equal(r.status(), 200, url); return r.json(); };
const inventory = await get('catalog-availability');
const hotelId = inventory.hotels[0], tourId = inventory.tours[0];
const hotel = await get('khachsan/' + hotelId);
const room = (await get('loaiphong/bykhachsan/' + hotelId)).find(r => r.trangThai && r.soLuongPhong > 0);
assert(room);
const destination = (await get('diadiem')).find(d => d.trangThai && d.hinhAnh?.length);
assert(destination);
const browser = await chromium.launch();
const checks = [], pageErrors = [], writes = [];
const output = path.join(root, '.impeccable/review/form-dialogs'); fs.mkdirSync(output, { recursive: true });
let reply = { status: 503, json: { message: 'Test safety: database write blocked' } };
async function context(role, width) {
  const ctx = await browser.newContext({ baseURL, viewport: { width, height: 960 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), sessions[role]);
  await ctx.route('**/api/**', async route => {
    const req = route.request(), url = new URL(req.url());
    if (!['GET', 'HEAD'].includes(req.method()) && !url.pathname.endsWith('/itineraries/estimate')) {
      writes.push({ method: req.method(), path: url.pathname });
      return route.fulfill(reply);
    }
    return route.continue();
  });
  const page = await ctx.newPage(); page.on('pageerror', e => pageErrors.push(e.message)); page.on('dialog', d => d.accept());
  return { ctx, page };
}
const top = page => page.locator('dialog[open]').last();
async function layout(page, file) {
  const modal = top(page); await expect(modal).toBeVisible();
  assert(await modal.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1 && el.scrollWidth <= el.clientWidth + 2; }), file + ' fits viewport');
  await modal.screenshot({ path: path.join(output, file + '.png') });
}
async function fillRequired(dialog) {
  const fields = dialog.locator('input:required,textarea:required,select:required');
  for (let i = 0; i < await fields.count(); i++) {
    const control = fields.nth(i); if (!await control.isEnabled()) continue;
    const tag = await control.evaluate(el => el.tagName), type = await control.getAttribute('type');
    if (tag === 'SELECT') {
      if (!await control.inputValue()) {
        const value = await control.locator('option').evaluateAll(options => options.find(o => o.value && !o.disabled)?.value);
        assert(value, 'Available lookup required'); await control.selectOption(value);
      }
    } else if (type === 'checkbox' || type === 'radio') continue;
    else if (!await control.inputValue()) await control.fill(type === 'date' ? '2027-11-01' : type === 'datetime-local' ? ((await control.getAttribute('name')) === 'ngayKetThuc' ? '2027-11-02T12:00' : '2027-11-01T12:00') : type === 'number' ? '1' : type === 'email' ? 'browser-only@example.com' : type === 'password' ? 'BrowserOnly@2027!' : 'Kiểm thử trong trình duyệt');
  }
}
try {
  for (const width of [1440, 390]) {
    const { ctx, page } = await context('admin', width);
    await page.goto('/admin/categories');
    const modules = await page.evaluate(async () => (await import('/src/pages/Admin/schema.ts')).modules);
    for (const [key, config] of Object.entries(modules)) {
      await page.goto('/admin/' + key);
      await expect(page.locator('.admin-count')).toBeVisible();
      const add = page.getByRole('button', { name: '+ Thêm mới', exact: true }); await add.click();
      let dialog = top(page); await expect(dialog.getByRole('heading', { name: 'Thêm mới ' + config.title.toLowerCase(), exact: true })).toBeVisible();
      assert.equal(await page.locator('main form').count(), 0, 'No inline CRUD editor below table');
      // Tab stays within native modal; Escape returns focus to the opener.
      await page.keyboard.press('Tab'); assert(await page.evaluate(() => document.activeElement.closest('dialog') !== null));
      await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(0); await expect(add).toBeFocused();
      await add.click(); dialog = top(page);
      const required = dialog.locator('input:required,textarea:required').first();
      if (await required.count()) {
        await required.fill(''); const before = writes.length;
        await dialog.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
        await expect(required).toHaveAttribute('aria-invalid', 'true'); assert.equal(writes.length, before, 'Client errors do not submit');
      }
      await fillRequired(dialog);
      const target = dialog.locator('[name="' + config.name + '"]'); assert.equal(await target.count(), 1);
      const preserved = await target.inputValue();
      reply = { status: 400, json: { errors: { [config.name]: ['Thông tin này cần sửa lại (phản hồi kiểm thử).'] } } };
      await dialog.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
      await expect(target).toHaveAttribute('aria-invalid', 'true'); await expect(target).toHaveValue(preserved);
      await expect(dialog.locator('.form-field-error').filter({ hasText: 'phản hồi kiểm thử' })).toBeVisible();
      if (key === 'tours' || key === 'users') await layout(page, `admin-${key}-${width}`);
      reply = { status: 200, json: { [config.id]: 999999 } };
      await dialog.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
      await expect(page.locator('dialog[open]')).toHaveCount(0); await expect(page.getByRole('status').filter({ hasText: 'Đã lưu thành công' })).toBeVisible();
      const edit = page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).first();
      const editAvailable = await edit.count() > 0;
      if (await edit.count()) {
        const rowId = await edit.locator('xpath=ancestor::tr').locator('td').first().innerText();
        const rows = await get(config.endpoint), row = rows.find(r => String(r[config.id]) === rowId.replace('#', ''));
        assert(row); await edit.click(); dialog = top(page);
        await expect(dialog.getByRole('heading', { name: 'Chỉnh sửa ' + config.title.toLowerCase(), exact: true })).toBeVisible();
        const input = dialog.locator('[name="' + config.name + '"]');
        const expected = config.name === 'ngayKhoiHanh' ? String(row[config.name]).slice(0, 10) : String(row[config.name] ?? '');
        await expect(input).toHaveValue(expected);
        if (key === 'users') await expect(dialog.locator('[name=matKhau]')).toHaveCount(0);
        reply = { status: 200, json: {} };
        await dialog.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
        await expect(page.locator('dialog[open]')).toHaveCount(0);
        await expect(page.getByRole('status').filter({ hasText: 'Đã lưu thành công' })).toBeVisible();
      }
      checks.push(`${width}px admin/${key}: add modal, required + API field error, value retained, success closes; ${editAvailable ? 'existing edit prefill/save' : 'no existing edit row'}`);
    }
    // Images: prefilled edit; partial upload failure retains only unfinished files for retry.
    await page.goto('/admin/hotels?id=' + hotelId); await expect(page.locator('.admin-count')).toBeVisible();
    await page.getByRole('button', { name: /^Quản lý bộ ảnh của / }).click();
    await expect(top(page).getByRole('button', { name: 'Thêm ảnh', exact: true })).toBeVisible();
    const imageEdit = top(page).getByRole('button', { name: 'Chỉnh sửa ảnh', exact: true }).first();
    if (await imageEdit.count()) {
      await imageEdit.click(); let d = top(page); await expect(d.locator('[name=moTa]')).not.toHaveValue('');
      await d.locator('[name=moTa]').fill('Mô tả ảnh kiểm thử');
      reply = { status: 400, json: { errors: { MoTa: ['Sửa mô tả ảnh.'] } } };
      await d.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click(); await expect(d.locator('[name=moTa]')).toHaveAttribute('aria-invalid', 'true');
      reply = { status: 200, json: {} }; await d.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
      await expect(page.locator('dialog[open]')).toHaveCount(1); await expect(top(page).getByRole('status').filter({ hasText: 'Đã cập nhật' })).toBeVisible();
    }
    await top(page).getByRole('button', { name: 'Thêm ảnh', exact: true }).click();
    await top(page).getByRole('button', { name: 'Tải ảnh lên', exact: true }).click(); await expect(top(page).locator('[name=files]')).toHaveAttribute('aria-invalid', 'true');
    await top(page).locator('[name=files]').setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('not image') });
    await top(page).getByRole('button', { name: 'Tải ảnh lên', exact: true }).click(); await expect(top(page).locator('.form-field-error')).toContainText('JPG');
    await top(page).locator('[name=files]').setInputFiles([{ name: 'one.png', mimeType: 'image/png', buffer: Buffer.from('mock-one') }, { name: 'two.png', mimeType: 'image/png', buffer: Buffer.from('mock-two') }]);
    let uploads = 0; await page.route('**/api/hinhanh/upload', route => route.fulfill(++uploads === 1 ? { status: 200, json: {} } : { status: 503, json: { message: 'Mất kết nối khi tải ảnh.' } }));
    await top(page).getByRole('button', { name: 'Tải ảnh lên', exact: true }).click(); await expect(top(page).getByText('1 ảnh được chọn · Tối đa 8 MB/ảnh', { exact: true })).toBeVisible();
    await expect(top(page).getByRole('alert').filter({ hasText: '1/2' })).toBeVisible();
    await page.unroute('**/api/hinhanh/upload'); reply = { status: 200, json: {} };
    await top(page).getByRole('button', { name: 'Tải ảnh lên', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(1);
    await page.keyboard.press('Escape'); checks.push(`${width}px images: edit, required/type validation, partial retry, success closes upload only`);
    // Payment form, field-specific server failure, no ledger writes.
    await page.goto('/admin/payments'); await page.getByRole('button', { name: 'Ghi nhận thanh toán', exact: true }).click();
    let d = top(page); await expect(d.locator('[name=order]')).toBeEnabled();
    const unpaid = (await get('dattour')).find(o => o.trangThai !== 'Cancelled' && o.tongTien > 0 && !(o.soTienDaThanhToan > 0));
    assert(unpaid); await d.locator('[name=order]').selectOption(String(unpaid.maDatTour)); await d.locator('[name=soTien]').fill('1');
    reply = { status: 400, json: { errors: { SoTien: ['Kiểm tra chứng từ số tiền.'] } } };
    await d.getByRole('button', { name: 'Tạo giao dịch chờ xác nhận', exact: true }).click(); await expect(d.locator('[name=soTien]')).toHaveAttribute('aria-invalid', 'true');
    reply = { status: 200, json: {} }; await d.getByRole('button', { name: 'Tạo giao dịch chờ xác nhận', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(0);
    checks.push(`${width}px payments: modal and field error, success closes`);
    await page.route('**/api/datphong', r => r.request().method() === 'GET' ? r.fulfill({ json: [{ maDatPhong: 999999, maNguoiDung: sessions.user.user.maNguoiDung, maLoaiPhong: room.maLoaiPhong, ngayNhanPhong: '2027-11-01', ngayTraPhong: '2027-11-02', tongTien: 1000000, soNguoi: 1, trangThai: 'Confirmed', yeuCauHuy: 'Pending', lyDoHuy: 'Lý do hủy kiểm thử' }] }) : r.fulfill(reply));
    await page.goto('/admin/room-orders'); await page.getByRole('button', { name: 'Xử lý yêu cầu', exact: true }).click(); d = top(page);
    await expect(d).toContainText('Lý do hủy kiểm thử'); await d.locator('[name=cancellationDecisionStatus]').selectOption('Rejected');
    await d.getByRole('button', { name: 'Lưu quyết định', exact: true }).click(); await expect(d.locator('[name=cancellationReply]')).toHaveAttribute('aria-invalid', 'true');
    await d.locator('[name=cancellationReply]').fill('Phản hồi kiểm thử'); reply = { status: 400, json: { errors: { CancellationReply: ['Sửa phản hồi cho khách.'] } } }; await d.getByRole('button', { name: 'Lưu quyết định', exact: true }).click(); await expect(d.locator('[name=cancellationReply]')).toHaveAttribute('aria-invalid', 'true');
    reply = { status: 200, json: {} }; await d.getByRole('button', { name: 'Lưu quyết định', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(0); await expect(page.getByRole('status')).toContainText('Đã xử lý');
    checks.push(`${width}px admin cancellation: modal, rejection reply required, server field error, success closes`);
    await ctx.close();
  }
  for (const width of [1440, 390, 320]) {
    const { ctx, page } = await context('user', width);
    // Feedback permission/read behavior is covered by account-details; this fixture drives allowed submission UI only.
    await page.route('**/api/feedback/hotels/*/eligibility', r => r.fulfill({ json: { canReview: true, alreadyReviewed: false, requirement: '' } }));
    await page.goto('/hotels/' + hotelId);
    await page.getByRole('button', { name: 'Viết bình luận', exact: true }).click(); let d = top(page);
    await d.getByRole('button', { name: 'Gửi bình luận', exact: true }).click(); await expect(d.locator('[name=content]')).toHaveAttribute('aria-invalid', 'true');
    await d.locator('[name=content]').fill('Bình luận kiểm thử, không ghi SQL.');
    reply = { status: 400, json: { errors: { Content: ['Nội dung bình luận cần sửa.'] } } };
    await d.getByRole('button', { name: 'Gửi bình luận', exact: true }).click(); await expect(d.locator('[name=content]')).toHaveAttribute('aria-invalid', 'true');
    await expect(d.locator('[name=content]')).toHaveValue('Bình luận kiểm thử, không ghi SQL.');
    await layout(page, `comment-error-${width}`);
    reply = { status: 200, json: {} }; await d.getByRole('button', { name: 'Gửi bình luận', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(0); await expect(page.getByRole('status').filter({ hasText: 'Đã gửi bình luận' })).toBeVisible();
    if (width === 1440) {
      await page.getByRole('button', { name: 'Viết bình luận', exact: true }).click(); d = top(page);
      await d.locator('[name=content]').fill('Nội dung vẫn giữ khi mạng lỗi.');
      reply = { status: 503, json: { message: 'Dịch vụ tạm thời không kết nối được.' } };
      await d.getByRole('button', { name: 'Gửi bình luận', exact: true }).click();
      await expect(d.locator('[name=content]')).toHaveValue('Nội dung vẫn giữ khi mạng lỗi.'); await expect(d.getByRole('alert')).toContainText('không kết nối');
      await expect(d.locator('[name=content]')).not.toHaveAttribute('aria-invalid', 'true');
      reply = { status: 429, json: { message: 'Bạn thao tác quá nhanh. Chờ rồi thử lại.' } }; await d.getByRole('button', { name: 'Gửi bình luận', exact: true }).click(); await expect(d.getByRole('alert')).toContainText('Chờ');
      let requests = 0; await page.route('**/api/feedback/hotels/*/comments', async r => { requests++; await new Promise(resolve => setTimeout(resolve, 450)); await r.fulfill({ status: 200, json: {} }); });
      await d.getByRole('button', { name: 'Gửi bình luận', exact: true }).evaluate(button => { for (let i = 0; i < 5; i++) button.click(); });
      await expect(d.getByRole('button', { name: 'Đóng biểu mẫu', exact: true })).toBeDisabled(); await page.keyboard.press('Escape'); await expect(d).toBeVisible();
      await expect(page.locator('dialog[open]')).toHaveCount(0); assert.equal(requests, 1, 'Repeated submit is locked'); await page.unroute('**/api/feedback/hotels/*/comments');
      checks.push('Network/rate limit retains form; busy blocks close and duplicate submission');
      reply = { status: 200, json: {} };
    }
    await page.getByRole('button', { name: 'Viết đánh giá', exact: true }).click(); d = top(page);
    await d.getByRole('button', { name: 'Gửi đánh giá', exact: true }).click(); await expect(d.locator('.form-field-error')).toHaveCount(1);
    await d.getByRole('radio', { name: '5 sao', exact: true }).check(); await d.getByRole('button', { name: 'Gửi đánh giá', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(0);
    checks.push(`${width}px feedback: required + server error, input retained, star group validation, success notice/close`);
    await page.goto(`/hotels/${hotelId}/book?room=${room.maLoaiPhong}&checkin=2027-11-01&checkout=2027-11-03`); d = top(page);
    await expect(d.getByRole('button', { name: 'Xác nhận yêu cầu đặt chỗ', exact: true })).toBeEnabled(); await expect(d.locator('[name=selected]')).toHaveValue(String(room.maLoaiPhong));
    await d.locator('[name=ngayTraPhong]').fill('2027-11-01'); await d.getByRole('button', { name: 'Xác nhận yêu cầu đặt chỗ', exact: true }).click(); await expect(d.locator('[name=ngayTraPhong]')).toHaveAttribute('aria-invalid', 'true');
    await d.locator('[name=ngayTraPhong]').fill('2027-11-03'); await expect(d.getByRole('button', { name: 'Xác nhận yêu cầu đặt chỗ', exact: true })).toBeEnabled();
    reply = { status: 409, json: { message: 'Không đủ phòng trống cho số phòng đã chọn.' } };
    await d.getByRole('button', { name: 'Xác nhận yêu cầu đặt chỗ', exact: true }).click(); await expect(d.locator('[name=soLuongPhong]')).toHaveAttribute('aria-invalid', 'true');
    await layout(page, `booking-error-${width}`);
    reply = { status: 200, json: { id: 999999, total: 1000000 } }; await d.getByRole('button', { name: 'Xác nhận yêu cầu đặt chỗ', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(0); await expect(page.getByRole('status')).toContainText('thành công');
    checks.push(`${width}px hotel booking: prefill, invalid dates + server conflict, success closes`);
    await page.goto('/planner'); d = top(page); await expect(d.locator('[name=tenChuyenDi]')).toBeVisible();
    await d.getByRole('button', { name: 'Lưu lịch trình', exact: true }).click(); await expect(d.locator('[name=tenChuyenDi]')).toHaveAttribute('aria-invalid', 'true');
    await d.locator('[name=tenChuyenDi]').fill('Bản nháp kiểm thử'); await d.locator('[name=diemKhoiHanh]').fill('Hà Nội'); await d.locator('[name=diemDen]').fill(destination.tenDiaDiem); await d.locator('[name=ngayBatDau]').fill('2027-11-01');
    await d.getByRole('button', { name: 'Chỉnh sửa ngày 1', exact: true }).click();
    await top(page).locator('[name=tieuDe]').fill('Khám phá'); await top(page).getByRole('button', { name: 'Lưu ngày vào bản nháp', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(1);
    await top(page).getByRole('button', { name: /Thêm hoạt động/ }).click(); await top(page).getByRole('button', { name: 'Chọn ' + destination.tenDiaDiem, exact: true }).click();
    let activity = top(page); await expect(activity.locator('[name=quantity]')).toBeVisible(); await expect(activity.getByRole('button', { name: 'Lưu hoạt động', exact: true })).toBeEnabled();
    await activity.getByRole('button', { name: 'Lưu hoạt động', exact: true }).click(); await expect(activity.locator('[name=thoiGianBatDau]')).toHaveAttribute('aria-invalid', 'true');
    await activity.locator('[name=thoiGianBatDau]').fill('08:00'); await activity.locator('[name=thoiGianKetThuc]').fill('07:00'); await activity.getByRole('button', { name: 'Lưu hoạt động', exact: true }).click(); await expect(activity.locator('[name=thoiGianKetThuc]')).toHaveAttribute('aria-invalid', 'true');
    await activity.locator('[name=thoiGianKetThuc]').fill('10:00'); await activity.locator('[name=ghiChu]').fill('Tham quan buổi sáng'); await activity.getByRole('button', { name: 'Lưu hoạt động', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(1);
    assert.equal(await top(page).locator('.event-timeline input').count(), 0, 'Saved draft summaries no longer expand inline inputs');
    await top(page).getByRole('button', { name: 'Chỉnh sửa hoạt động 1 ngày 1', exact: true }).click(); activity = top(page); await expect(activity.locator('[name=thoiGianBatDau]')).toHaveValue('08:00'); await expect(activity.locator('[name=ghiChu]')).toHaveValue('Tham quan buổi sáng'); await page.keyboard.press('Escape');
    await top(page).getByRole('button', { name: /Thêm hoạt động/ }).click(); await top(page).getByRole('button', { name: 'Chọn ' + destination.tenDiaDiem, exact: true }).click(); activity = top(page);
    await activity.locator('[name=thoiGianBatDau]').fill('09:00'); await activity.locator('[name=thoiGianKetThuc]').fill('11:00'); await expect(activity.getByRole('button', { name: 'Lưu hoạt động', exact: true })).toBeEnabled(); await activity.getByRole('button', { name: 'Lưu hoạt động', exact: true }).click(); await expect(activity.locator('.form-field-error')).toContainText('trùng'); await page.keyboard.press('Escape');
    await top(page).getByRole('button', { name: 'Thêm một ngày', exact: true }).click(); await top(page).locator('[name=tieuDe]').fill('Ngày thứ hai'); await top(page).getByRole('button', { name: 'Lưu ngày vào bản nháp', exact: true }).click();
    await layout(page, `planner-${width}`);
    reply = { status: 400, json: { errors: { TenChuyenDi: ['Sửa tên chuyến đi.'] } } }; await top(page).getByRole('button', { name: 'Lưu lịch trình', exact: true }).click(); await expect(top(page).locator('[name=tenChuyenDi]')).toHaveAttribute('aria-invalid', 'true');
    reply = { status: 200, json: { id: 999999 } }; await top(page).getByRole('button', { name: 'Lưu lịch trình', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(0); await expect(page.getByRole('status').filter({ hasText: 'Đã tạo lịch trình thành công' })).toBeVisible();
    checks.push(`${width}px planner: day/activity modal, prefill, required/time/overlap errors, no inline edit, server error and success close`);
    // Account-only fixtures ensure future cancellation and member flows exist without modifying SQL.
    const trip = { maChuyenDi: 999998, tenChuyenDi: 'Lịch trình kiểm thử', diemKhoiHanh: 'Hà Nội', diemDen: 'Hà Nội', ngayBatDau: '2027-11-01', ngayKetThuc: '2027-11-01', soNguoi: 1, nganSach: 0, isOwner: true, canEdit: true, revision: 1, days: [{ ngayThu: 1, ngay: '2027-11-01', tieuDe: 'Ngày đầu', ghiChu: '', activities: [] }] };
    await page.route('**/api/account', r => r.fulfill({ json: { tours: [], hotels: [{ id: 999998, hotelId, roomId: room.maLoaiPhong, name: hotel.tenKhachSan, startDate: '2027-11-01', endDate: '2027-11-02', status: 'Confirmed', people: 1, rooms: 1, total: 1000000, paid: 0 }], trips: [trip], invitations: [] } }));
    await page.route('**/api/account/itineraries/999998/members', r => r.request().method() === 'GET' ? r.fulfill({ json: [] }) : r.fulfill(reply));
    await page.goto('/account?tab=hotels'); await page.getByRole('button', { name: 'Yêu cầu hủy đơn', exact: true }).click();
    await top(page).locator('[name=reason]').fill('Thay đổi kế hoạch'); reply = { status: 400, json: { errors: { Reason: ['Sửa lý do hủy.'] } } }; await top(page).getByRole('button', { name: 'Gửi yêu cầu hủy', exact: true }).click(); await expect(top(page).locator('[name=reason]')).toHaveAttribute('aria-invalid', 'true');
    reply = { status: 200, json: { message: 'Đã gửi yêu cầu hủy.' } }; await top(page).getByRole('button', { name: 'Gửi yêu cầu hủy', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(0);
    await page.goto('/account/trips/999998'); await page.getByRole('button', { name: 'Quản lý thành viên', exact: true }).click(); await top(page).getByRole('button', { name: 'Mời thành viên', exact: true }).click(); await top(page).locator('[name=email]').fill('wrong'); await top(page).getByRole('button', { name: 'Gửi lời mời', exact: true }).click(); await expect(top(page).locator('[name=email]')).toHaveAttribute('aria-invalid', 'true');
    await top(page).locator('[name=email]').fill('browser-only@example.com'); reply = { status: 400, json: { errors: { Email: ['Email chưa đăng ký.'] } } }; await top(page).getByRole('button', { name: 'Gửi lời mời', exact: true }).click(); await expect(top(page).locator('[name=email]')).toHaveAttribute('aria-invalid', 'true');
    reply = { status: 200, json: {} }; await top(page).getByRole('button', { name: 'Gửi lời mời', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(0); await expect(page.getByRole('status').filter({ hasText: 'Đã gửi lời mời' })).toBeVisible();
    await page.getByRole('link', { name: 'Sửa lịch trình', exact: true }).click(); await expect(top(page).locator('[name=tenChuyenDi]')).toHaveValue(trip.tenChuyenDi); await top(page).getByRole('button', { name: 'Chỉnh sửa ngày 1', exact: true }).click(); await expect(top(page).locator('[name=tieuDe]')).toHaveValue('Ngày đầu'); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    checks.push(`${width}px cancellation/members: modal, client + API field errors, success closes; itinerary edit prefilled`);
    await ctx.close();
  }
  assert.deepEqual(pageErrors, []); console.log(JSON.stringify({ checks, pageErrors, interceptedMutations: writes.length, databaseWrites: 0 }, null, 2));
} finally { await browser.close(); await client.dispose(); }
