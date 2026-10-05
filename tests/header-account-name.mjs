// Existing SQL accounts: login + GET only; no catalog/account data mutations.
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
const client = await request.newContext({ baseURL });
const sessions = {}, checks = [], errors = [];
for (const role of ['admin', 'user']) {
  const r = await client.post('/api/auth/login', { data: { email: accounts[role].email, matKhau: accounts[role].password } });
  assert.equal(r.status(), 200, role + ' existing account login'); sessions[role] = await r.json();
}
const browser = await chromium.launch();
const output = path.join(root, '.impeccable/review/header-account-name'); fs.mkdirSync(output, { recursive: true });
const header = page => page.locator('.travel-header');
async function layout(page, file) {
  assert(await header(page).evaluate(el => {
    const items = ['.travel-wordmark', '.travel-account', '.travel-menu-button', '.travel-admin'].map(s => el.querySelector(s)).filter(Boolean).map(e => e.getBoundingClientRect());
    return el.scrollWidth <= el.clientWidth + 1 && items.every(r => r.left >= 0 && r.right <= innerWidth + 1 && r.width > 0) && el.querySelector('.travel-account-name').clientWidth >= 20;
  }), 'Header controls and readable name fit viewport');
  await header(page).screenshot({ path: path.join(output, file + '.png') });
}
try {
  for (const width of [1440, 390, 320]) {
    for (const role of ['admin', 'user']) {
      const ctx = await browser.newContext({ baseURL, viewport: { width, height: 960 }, reducedMotion: 'reduce' });
      await ctx.route('**/api/**', route => ['GET', 'HEAD'].includes(route.request().method()) || new URL(route.request().url()).pathname === '/api/auth/login' ? route.continue() : route.fulfill({ status: 503, json: { message: 'Test safety: mutation blocked' } }));
      const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
      if (width === 1440) {
        await page.goto('/login');
        await expect(header(page).getByRole('link', { name: 'Đăng nhập', exact: true })).toHaveAttribute('href', '/login');
        await page.getByRole('textbox', { name: 'Email', exact: true }).fill(accounts[role].email);
        await page.locator('input[autocomplete="current-password"]').fill(accounts[role].password);
        await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
        await expect(page).toHaveURL(new URL(role === 'admin' ? '/admin' : '/account', baseURL).href);
        await page.goto('/');
      } else {
        await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), sessions[role]);
        await page.goto('/');
      }
      const account = header(page).locator('.travel-account');
      await expect(account.locator('.travel-account-name')).toHaveText(sessions[role].user.hoTen.trim());
      await expect(account).toHaveAttribute('href', '/account');
      await expect(header(page).locator('.travel-admin')).toHaveCount(role === 'admin' ? 1 : 0);
      await layout(page, `${role}-${width}`);
      await account.click(); await expect(page).toHaveURL(new URL('/account', baseURL).href);
      await expect(account.locator('.travel-account-name')).toHaveText(sessions[role].user.hoTen.trim());
      await page.reload(); await expect(account.locator('.travel-account-name')).toHaveText(sessions[role].user.hoTen.trim());
      await header(page).getByRole('button', { name: 'Mở menu', exact: true }).click();
      await page.locator('#immersive-navigation').getByRole('button', { name: 'Đăng xuất', exact: false }).click();
      await expect(account.locator('.travel-account-name')).toHaveText('Đăng nhập');
      await expect(account).toHaveAttribute('href', '/login');
      await expect(header(page).locator('.travel-admin')).toHaveCount(0);
      checks.push(`${role}: login name, account link, reload, logout, layout — ${width}px`);
      await ctx.close();
    }
    // Long/blank names are browser-only fixtures, not SQL profile edits.
    const ctx = await browser.newContext({ baseURL, viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), sessions.admin);
    let name = 'Nguyễn Thị Minh Anh — tên tài khoản rất dài dùng kiểm thử hiển thị';
    await ctx.route('**/api/auth/me', route => route.fulfill({ json: { ...sessions.admin.user, hoTen: name } }));
    const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await expect(header(page).locator('.travel-account-name')).toHaveText(name);
    await expect(header(page).locator('.travel-account')).toHaveAttribute('title', name);
    await layout(page, `long-name-${width}`);
    name = '   '; await page.reload();
    await expect(header(page).locator('.travel-account-name')).toHaveText('Tài khoản');
    await page.evaluate(() => { localStorage.removeItem('tripmate_auth'); window.dispatchEvent(new Event('session-expired')); });
    await expect(header(page).locator('.travel-account-name')).toHaveText('Đăng nhập');
    checks.push(`Long name fits, full-name tooltip, blank fallback, expired session — ${width}px`);
    await ctx.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: checks.length, pageErrors: errors, checks }, null, 2));
} finally { await browser.close(); await client.dispose(); }
