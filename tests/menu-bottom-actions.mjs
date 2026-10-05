// Existing SQL account login/GET only. All browser writes are blocked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, request, expect } = require('@playwright/test');
const baseURL = process.env.UI_BASE_URL || 'http://127.0.0.1:5173';
const accounts = JSON.parse(fs.readFileSync(path.join(root, '.local/test-accounts.json'), 'utf8'));
const client = await request.newContext({ baseURL }), sessions = {}, checks = [], errors = [];
for (const role of ['admin', 'user']) {
  const r = await client.post('/api/auth/login', { data: { email: accounts[role].email, matKhau: accounts[role].password } });
  assert.equal(r.status(), 200); sessions[role] = await r.json();
}
const browser = await chromium.launch();
const output = path.join(root, '.impeccable/review/menu-bottom-actions'); fs.mkdirSync(output, { recursive: true });
try {
  for (const width of [1920, 1440, 390, 320]) for (const role of ['anonymous', 'admin', 'user']) {
    const ctx = await browser.newContext({ baseURL, viewport: { width, height: width > 1000 ? 1080 : 844 }, reducedMotion: 'reduce' });
    if (sessions[role]) await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), sessions[role]);
    await ctx.route('**/api/**', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.fulfill({ status: 503, json: { message: 'Test safety: writes blocked' } }));
    const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    if (sessions[role]) await expect(page.locator('.travel-account-name')).toHaveText(sessions[role].user.hoTen.trim());
    const opener = page.getByRole('button', { name: 'Mở menu', exact: true }); await opener.click();
    const menu = page.locator('#immersive-navigation'), footer = menu.locator('.immersive-bottom'), actions = footer.locator('a,button');
    await footer.scrollIntoViewIfNeeded();
    assert.equal(await actions.count(), role === 'admin' ? 2 : 1);
    assert(await footer.evaluate(el => {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      return r.left >= 0 && r.right <= innerWidth + 1 && el.scrollWidth <= el.clientWidth + 1 && style.fontSize === '14px';
    }), 'Footer fits viewport and secondary copy is readable');
    for (let i = 0; i < await actions.count(); i++) {
      const action = actions.nth(i);
      assert(await action.evaluate(el => {
        const r = el.getBoundingClientRect(), style = getComputedStyle(el);
        return style.fontSize === '16px' && Number(style.fontWeight) >= 500 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth + 1 && style.color === 'rgb(40, 75, 65)';
      }), 'Action typography, contrast color and 44px tap area');
      await action.hover(); await expect(action).toHaveCSS('text-decoration-line', 'underline');
      await page.keyboard.press('Tab'); await action.focus(); await expect(action).toBeFocused(); await expect(action).toHaveCSS('outline-width', '2px');
    }
    if (role === 'admin') await page.screenshot({ path: path.join(output, `admin-menu-${width}.png`) });
    await page.keyboard.press('Escape'); await expect(menu).not.toHaveClass(/is-open/); await expect(opener).toBeFocused();
    await opener.click(); await footer.scrollIntoViewIfNeeded();
    if (role === 'admin') {
      await footer.getByRole('link', { name: 'Quản trị hệ thống', exact: false }).click();
      await expect(page).toHaveURL(new URL('/admin', baseURL).href);
      await page.goto('/'); await expect(page.locator('.travel-account-name')).toHaveText(sessions[role].user.hoTen.trim());
      await page.getByRole('button', { name: 'Mở menu', exact: true }).click(); await footer.scrollIntoViewIfNeeded();
    }
    if (role === 'anonymous') {
      await footer.getByRole('link', { name: 'Bắt đầu hành trình', exact: false }).click();
      await expect(page).toHaveURL(new URL('/register', baseURL).href);
    } else {
      await footer.getByRole('button', { name: 'Đăng xuất', exact: false }).click();
      await expect(menu).not.toHaveClass(/is-open/);
      await expect(page.locator('.travel-account-name')).toHaveText('Đăng nhập');
    }
    checks.push(`${role}: 16px/44px actions, 14px secondary copy, layout, hover/focus, Escape and navigation — ${width}px`);
    await ctx.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: checks.length, pageErrors: errors, checks }, null, 2));
} finally { await browser.close(); await client.dispose(); }
