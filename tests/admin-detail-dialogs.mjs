// Existing SQL admin login + GET only. All browser mutations are mocked, never sent to SQL.
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
const account = JSON.parse(fs.readFileSync(path.join(root, '.local/test-accounts.json'), 'utf8')).admin;
const login = await client.post('/api/auth/login', { data: { email: account.email, matKhau: account.password } });
assert.equal(login.status(), 200, 'Existing SQL admin login');
const session = await login.json();
const browser = await chromium.launch();
const errors = [], checks = [], mockedEmpty = new Set();
const output = path.join(root, '.impeccable/review/admin-details');
fs.mkdirSync(output, { recursive: true });
const top = page => page.locator('dialog[open]').last();
let mutationReply = { status: 503, json: { message: 'Không thể cập nhật lúc này. Vui lòng thử lại.' } };
let pendingMutation;
let holdMutation = false;
let mutationCount = 0;
try {
  for (const width of [1440, 390, 320]) {
    const ctx = await browser.newContext({ baseURL, viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), session);
    await ctx.route('**/api/**', async route => {
      if (['GET', 'HEAD'].includes(route.request().method())) return route.continue();
      mutationCount++;
      if (holdMutation) { pendingMutation = route; return; }
      return route.fulfill(mutationReply);
    });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept());
    await page.goto('/admin/roles');
    await expect(page.getByRole('heading', { level: 1, name: 'Vai trò hệ thống' })).toBeVisible();
    const sections = await page.evaluate(async () => (await import('/src/pages/Admin/dataRegistry.ts')).dataSections);
    for (const [key, config] of Object.entries(sections)) {
      const response = await client.get('/api/' + config.endpoint, { headers: { Authorization: 'Bearer ' + session.token } });
      assert.equal(response.status(), 200, config.endpoint);
      const realRows = await response.json();
      // Empty sections get browser-only display fixtures. No record is created in SQL.
      const rows = realRows.length ? realRows : [{ [config.id]: 999999, maChuyenDi: 999999, maLichTrinh: 999999, maNguoiDung: session.user.maNguoiDung, tenChuyenDi: 'Kế hoạch kiểm thử trình duyệt', tieuDe: 'Ngày kiểm thử', vaiTro: 'Member', trangThai: true, loaiDiaDiem: 'DiaDiem', maDiaDiem: 1, chiPhi: 0, ghiChu: 'Dữ liệu chỉ có trong trình duyệt' }];
      if (!realRows.length) {
        mockedEmpty.add(key);
        await ctx.route('**/api/' + config.endpoint, route => route.fulfill({ status: 200, json: rows }));
      }
      await page.goto('/admin/' + key);
      const opener = page.getByRole('button', { name: /^Xem chi tiết #/ }).first();
      await expect(opener).toBeVisible();
      const id = (await opener.innerText()).split('#')[1];
      const row = rows.find(r => String(r[config.id]) === id);
      assert(row, key + ' opens existing row');
      await opener.click();
      const dialog = top(page);
      await expect(dialog.getByRole('heading', { name: `${config.title} — Chi tiết #${id}`, exact: true })).toBeVisible();
      assert.equal(await page.locator('main [aria-label="Chi tiết bản ghi"]').count(), 0, 'No inline detail');
      assert.equal(await dialog.locator('dl > div').count(), config.fields.filter(([key]) => row[key] !== null && row[key] !== undefined).length, 'All existing detail fields retained');
      assert(await dialog.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1 && el.scrollWidth <= el.clientWidth + 2; }), key + ' fits ' + width);
      await page.keyboard.press('Tab');
      assert(await page.evaluate(() => !!document.activeElement.closest('dialog')), 'Keyboard focus stays in modal');
      if (['trips', 'reviews', 'images'].includes(key)) await page.screenshot({ path: path.join(output, `${key}-${width}.png`) });
      await page.keyboard.press('Escape');
      await expect(page.locator('dialog[open]')).toHaveCount(0);
      await expect(opener).toBeFocused();
      // Preserve selected list/search while closing through the footer.
      const query = page.getByRole('textbox', { name: 'Tìm trong dữ liệu' });
      const searchable = config.fields.map(([k]) => row[k]).find(v => typeof v === 'string' && v.length > 0);
      if (searchable) await query.fill(searchable.slice(0, 16));
      const savedQuery = await query.inputValue();
      await page.getByRole('button', { name: 'Xem chi tiết #' + id, exact: true }).click();
      await top(page).getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      await expect(query).toHaveValue(savedQuery);
      checks.push(`${key}: details, fields, focus, close, search — ${width}px`);
      if (key === 'trips' || key === 'days') {
        await page.getByRole('button', { name: 'Xem chi tiết #' + id, exact: true }).click();
        const target = key === 'trips' ? `/admin/days?trip=${row.maChuyenDi}` : `/admin/events?day=${row.maLichTrinh}`;
        await top(page).getByRole('link', { name: key === 'trips' ? 'Xem từng ngày' : 'Xem hoạt động trong ngày', exact: true }).click();
        await expect(page).toHaveURL(new URL(target, baseURL).href);
        await expect(page.locator('dialog[open]')).toHaveCount(0);
      }
    }
    // Read actual image detail and correct service album; nested Escape closes one layer at a time.
    await page.goto('/admin/images');
    await page.getByRole('button', { name: /^Xem chi tiết #/ }).first().click();
    await top(page).getByRole('button', { name: 'Quản lý bộ ảnh dịch vụ này' }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(2);
    await top(page).getByRole('button', { name: 'Thêm ảnh', exact: true }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(3);
    await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(2);
    await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(1);
    await expect(top(page).getByRole('button', { name: 'Quản lý bộ ảnh dịch vụ này' })).toBeFocused();
    await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(0);
    checks.push(`Nested image/detail/upload dialogs — ${width}px`);
    await ctx.close();
  }
  // Browser-only fixtures make moderation deterministic without altering customer records.
  const ctx = await browser.newContext({ baseURL, viewport: { width: 390, height: 960 } });
  await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), session);
  await ctx.route('**/api/**', async route => {
    if (['GET', 'HEAD'].includes(route.request().method())) return route.continue();
    mutationCount++;
    if (holdMutation) { pendingMutation = route; return; }
    return route.fulfill(mutationReply);
  });
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  for (const [section, endpoint, idKey, label] of [['comments', 'binhluan', 'maBinhLuan', 'bình luận'], ['reviews', 'danhgia', 'maDanhGia', 'đánh giá']]) {
    const content = 'Nội dung kiểm thử chỉ trong trình duyệt. ' + 'Văn bản dài không được tràn màn hình. '.repeat(20);
    await ctx.route('**/api/' + endpoint, route => route.fulfill({ status: 200, json: [{ [idKey]: 999999, maNguoiDung: session.user.maNguoiDung, noiDung: content, trangThai: true, soSao: 5, daXacMinh: true }] }));
    await page.goto('/admin/' + section);
    await page.getByRole('button', { name: 'Xem chi tiết #999999' }).click();
    holdMutation = true; pendingMutation = undefined;
    await top(page).getByRole('button', { name: 'Ẩn ' + label, exact: true }).click();
    await expect(top(page).getByRole('button', { name: 'Đóng biểu mẫu' })).toBeDisabled();
    await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(1);
    assert(pendingMutation, 'Moderation request intercepted');
    await pendingMutation.fulfill(mutationReply); holdMutation = false;
    await expect(top(page).getByRole('alert')).toHaveText(mutationReply.json.message);
    await expect(top(page).locator('dd').filter({ hasText: content })).toHaveText(content);
    await expect(top(page).getByRole('button', { name: 'Đóng biểu mẫu' })).toBeEnabled();
    mutationReply = { status: 200, json: {} };
    await top(page).getByRole('button', { name: 'Ẩn ' + label, exact: true }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: `Đã cập nhật trạng thái ${label}.` })).toBeVisible();
    mutationReply = { status: 503, json: { message: 'Không thể cập nhật lúc này. Vui lòng thử lại.' } };
    checks.push(`${section}: busy lock, visible error, retained content, success close (mocked writes)`);
  }
  await ctx.close();
  assert.deepEqual(errors, [], 'No browser JavaScript errors');
  console.log(JSON.stringify({ passed: checks.length, mockedEmptySections: [...mockedEmpty], interceptedWrites: mutationCount, pageErrors: errors, checks }, null, 2));
} finally { await browser.close(); await client.dispose(); }
