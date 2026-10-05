// Existing SQL user; GET and read-only estimate only. Edits stay in isolated browser drafts.
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
const login = await client.post('/api/auth/login', { data: { email: accounts.user.email, matKhau: accounts.user.password } });
assert.equal(login.status(), 200);
const session = await login.json();
const places = await (await client.get('/api/diadiem')).json();
const place = places.find(p => p.trangThai && p.giaVe > 0 && !p.mienPhi);
assert(place, 'Real priced destination exists');
const inventory = await (await client.get('/api/catalog-availability')).json();
assert(inventory.hotels[0], 'Bookable hotel exists for dialog isolation check');
const browser = await chromium.launch();
const output = path.join(root, '.impeccable/review/planner-typography'); fs.mkdirSync(output, { recursive: true });
const checks = [], errors = [], writes = [];
const top = page => page.locator('dialog[open]').last();
async function fit(dialog) {
  assert(await dialog.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && el.scrollWidth <= el.clientWidth + 2; }), 'Dialog fits viewport');
}
async function type(dialog, width) {
  const result = await dialog.evaluate(el => {
    const root = getComputedStyle(el);
    const targets = [...el.querySelectorAll('h2,h3,h4,p,label,input,button,strong,dt,dd')];
    return { family: root.fontFamily, families: [...new Set(targets.map(e => getComputedStyle(e).fontFamily))], size: root.fontSize };
  });
  assert(result.family.includes('EuclidSquare'));
  assert.deepEqual(result.families, [result.family], 'All roles use the same established family');
  assert.equal(result.size, '15px');
  await expect(dialog.locator('.form-dialog-heading h2')).toHaveCSS('font-size', '20px');
  for (const label of await dialog.locator('.user-form label').all()) await expect(label).toHaveCSS('font-size', '15px');
  for (const input of await dialog.locator('input').all()) await expect(input).toHaveCSS('font-size', width <= 600 ? '16px' : '15px');
  await fit(dialog);
}
try {
  for (const width of [1440, 390, 320]) {
    const ctx = await browser.newContext({ baseURL, viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), session);
    await ctx.route('**/api/**', route => {
      const req = route.request();
      if (['GET', 'HEAD'].includes(req.method()) || new URL(req.url()).pathname.endsWith('/itineraries/estimate')) return route.continue();
      writes.push(req.method() + ' ' + new URL(req.url()).pathname);
      return route.fulfill({ status: 503, json: { message: 'Database writes blocked' } });
    });
    const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
    await page.goto('/planner');
    const main = top(page); await expect(main.locator('.cost-grand-total')).toHaveText('Chưa có dự toán');
    await expect(main.locator('[name=tenChuyenDi]')).toBeFocused();
    await type(main, width);
    for (const selector of ['.cost-ledger h2', '.cost-grand-total']) {
      await expect(main.locator(selector)).toHaveCSS('font-size', '15px');
      await expect(main.locator(selector)).toHaveCSS('font-weight', '500');
    }
    await main.screenshot({ path: path.join(output, `empty-${width}.png`) });
    await main.locator('.cost-ledger').screenshot({ path: path.join(output, `ledger-empty-${width}.png`) });
    await main.locator('[name=tenChuyenDi]').fill('Cuối tuần khám phá miền Bắc cùng gia đình');
    await main.locator('[name=diemDen]').fill(place.tinhThanh || 'Việt Nam');
    await main.getByRole('button', { name: 'Chỉnh sửa ngày 1', exact: true }).click();
    await type(top(page), width);
    await top(page).locator('[name=tieuDe]').fill('Tham quan và trải nghiệm văn hóa địa phương');
    await top(page).getByRole('button', { name: 'Lưu ngày vào bản nháp', exact: true }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await expect(main.getByRole('heading', { name: 'Tham quan và trải nghiệm văn hóa địa phương', exact: true })).toBeVisible();
    await main.getByRole('button', { name: 'Thêm hoạt động · 0/20', exact: true }).click();
    await type(top(page), width);
    await top(page).getByRole('searchbox').fill(place.tenDiaDiem);
    await top(page).getByRole('button', { name: 'Chọn ' + place.tenDiaDiem, exact: true }).click();
    await type(top(page), width);
    await top(page).locator('[name=thoiGianBatDau]').fill('08:00');
    await top(page).locator('[name=thoiGianKetThuc]').fill('10:00');
    await top(page).locator('[name=quantity]').fill('2');
    await expect(top(page).getByRole('button', { name: 'Lưu hoạt động', exact: true })).toBeEnabled();
    await expect(top(page).locator('.event-cost')).toContainText('× 2');
    const price = await top(page).locator('.event-cost > strong').innerText();
    await top(page).screenshot({ path: path.join(output, `activity-${width}.png`) });
    await top(page).getByRole('button', { name: 'Lưu hoạt động', exact: true }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await expect(main.locator('.cost-grand-total')).toHaveText(price);
    await expect(main.locator('.cost-grand-total')).toHaveCSS('font-size', '15px');
    await expect(main.locator('.cost-grand-total')).toHaveCSS('font-weight', '500');
    await main.locator('[name=nganSach]').fill('5000000');
    await expect(main.locator('.cost-budget strong')).not.toHaveText('Chưa đặt ngân sách');
    await expect(main.locator('.cost-budget strong')).toHaveCSS('font-weight', '500');
    await main.locator('.cost-ledger').screenshot({ path: path.join(output, `ledger-priced-${width}.png`) });
    await fit(main);
    assert(await main.getByRole('button', { name: 'Lưu lịch trình', exact: true }).evaluate(el => el.getBoundingClientRect().height >= 44));
    await main.getByRole('button', { name: 'Lưu lịch trình', exact: true }).click();
    await expect(main.locator('[name=diemKhoiHanh]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    if (width === 1440) {
      await page.addStyleTag({ content: 'html { font-size: 200%; }' });
      await expect(main.locator('.cost-grand-total')).toHaveCSS('font-size', '30px');
      await fit(main);
      checks.push('200% text scaling: planner typography scales and modal fits');
    }
    checks.push(`${width}px: consistent font/weight, empty + priced ledger, day/activity dialogs, real estimate, focus/touch target and field validation`);
    await page.goto(`/hotels/${inventory.hotels[0]}/book`);
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await expect(page.locator('.planner-dialog')).toHaveCount(0);
    await expect(top(page).locator('.form-dialog-heading h2')).toHaveCSS('font-size', width <= 600 ? '20px' : '24px');
    checks.push(`${width}px: unrelated booking dialog keeps its original type scale`);
    await ctx.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  console.log(JSON.stringify({ passed: checks.length, pageErrors: errors, databaseWrites: writes, checks }, null, 2));
} finally { await browser.close(); await client.dispose(); }
