// Existing SQL admin account, GET-only galleries. All browser mutations are blocked.
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
assert.equal(login.status(), 200);
const session = await login.json();
const browser = await chromium.launch();
const output = path.join(root, '.impeccable/review/row-albums'); fs.mkdirSync(output, { recursive: true });
const checks = [], errors = [];
const top = page => page.locator('dialog[open]').last();
const get = async url => { const r = await client.get('/api/' + url, { headers: { Authorization: 'Bearer ' + session.token } }); assert.equal(r.status(), 200, url); return r.json(); };
try {
  for (const width of [1440, 390, 320]) {
    const ctx = await browser.newContext({ baseURL, viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), session);
    await ctx.route('**/api/**', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.fulfill({ status: 503, json: { message: 'Test safety: writes blocked' } }));
    const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto('/admin/restaurants'); await expect(page.locator('.admin-count')).toBeVisible();
    const modules = await page.evaluate(async () => (await import('/src/pages/Admin/schema.ts')).modules);
    for (const [key, config] of Object.entries(modules).filter(([, c]) => c.owner)) {
      const rows = await get(config.endpoint); assert(rows.length, key + ' real rows');
      await page.goto('/admin/' + key); await expect(page.locator('.admin-count')).toBeVisible();
      assert.equal(await page.locator('.admin-media-picker').count(), 0, 'No album dropdown below list');
      await expect(page.locator('tbody tr .admin-media-action')).toHaveCount(Math.min(10, rows.length));
      if (key === 'restaurants') await page.screenshot({ path: path.join(output, `restaurant-list-${width}.png`) });
      // First/second records plus a record on page two prove correct row/owner binding.
      const sample = rows.slice(0, 2); if (rows.length > 10) sample.push(rows[10]);
      for (const row of sample) {
        const id = row[config.id], name = row[config.name];
        const photos = await get(`hinhanh/${config.owner}/${id}`);
        await page.goto(`/admin/${key}?id=${id}`); await expect(page.locator('.admin-count')).toBeVisible();
        const opener = page.getByRole('button', { name: `Quản lý bộ ảnh của ${name}`, exact: true });
        assert(await opener.evaluate(el => el.closest('td').cellIndex === 3), 'Album action in Thao tác cell');
        await opener.click();
        const dialog = top(page);
        await expect(dialog.getByRole('heading', { name: `Bộ ảnh — ${name} (#${id})`, exact: true })).toBeVisible();
        await expect(dialog.locator('.admin-image-card')).toHaveCount(photos.length);
        assert.deepEqual(await dialog.locator('.admin-image-card > img').evaluateAll(imgs => imgs.map(i => i.getAttribute('src'))), photos.map(p => p.duongDan), 'Exactly selected service photos');
        if (photos.length) await expect.poll(() => dialog.locator('.admin-image-card > img').evaluateAll(imgs => imgs.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
        else await expect(dialog.getByText('Chưa có ảnh cho dịch vụ này.', { exact: false })).toBeVisible();
        assert(await dialog.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && el.scrollWidth <= el.clientWidth + 2; }), 'Album fits viewport');
        if (row === sample[0] && key === 'restaurants') await page.screenshot({ path: path.join(output, `restaurant-album-${width}.png`) });
        if (key === 'tours') {
          await expect(dialog.getByRole('button', { name: 'Lịch trình từng ngày', exact: true })).toBeVisible();
          await dialog.getByRole('button', { name: 'Ngày khởi hành', exact: true }).click();
          await expect(dialog.locator('.admin-count')).toBeVisible();
        }
        if (key === 'hotels') await expect(dialog.getByRole('link', { name: 'Quản lý loại phòng, giá và ảnh của khách sạn này' })).toHaveAttribute('href', `/admin/rooms?hotel=${id}`);
        await dialog.getByRole('button', { name: 'Thêm ảnh', exact: true }).click();
        await expect(page.locator('dialog[open]')).toHaveCount(2);
        await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(1);
        await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(0);
        await expect(opener).toBeFocused();
      }
      checks.push(`${key}: row action, exact galleries, related controls, nested forms, focus — ${width}px`);
    }
    await page.goto('/admin/categories'); await expect(page.locator('.admin-count')).toBeVisible();
    await expect(page.locator('.admin-media-action')).toHaveCount(0);
    checks.push(`No album action on non-media module — ${width}px`);
    await ctx.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: checks.length, pageErrors: errors, checks }, null, 2));
} finally { await browser.close(); await client.dispose(); }
