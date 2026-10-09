// GET-only UI review with existing SQL accounts. --capture records one batched visual round.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, request, expect } = require('@playwright/test');
const baseURL = process.env.UI_BASE_URL || 'http://127.0.0.1:5173';
const capture = process.argv.includes('--capture');
const output = path.join(root, '.impeccable/review/full-2026-10-08-after');
if (capture) fs.mkdirSync(output, { recursive: true });
const client = await request.newContext({ baseURL });
const accounts = JSON.parse(fs.readFileSync(path.join(root, '.local/test-accounts.json'), 'utf8'));
const sessions = {};
for (const role of ['user', 'admin']) {
  const response = await client.post('/api/auth/login', { data: { email: accounts[role].email, matKhau: accounts[role].password } });
  assert.equal(response.status(), 200, `Existing ${role} login succeeds`);
  sessions[role] = await response.json();
}
const hotels = await (await client.get('/api/khachsan')).json();
const hotel = hotels.find(h => h.trangThai && h.hinhAnh?.length >= 2);
assert(hotel);
const browser = await chromium.launch(), checks = [], errors = [], metrics = [];
let blockedWrites = 0;
async function shot(page, name, width, target = page) {
  await page.evaluate(() => document.fonts.ready);
  if (capture) await target.screenshot({ path: path.join(output, `${name}-${width}.png`) });
}
async function touch(locator) {
  for (const control of await locator.all()) await expect.poll(() => control.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
}
async function fit(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal document overflow');
}
async function header(page, width) {
  await touch(page.locator('.travel-account,.travel-admin,.travel-menu-button'));
  await expect(page.locator('.travel-account')).toHaveCSS('font-size', width <= 600 ? '13px' : '14px');
  assert(await page.locator('.travel-header-actions').evaluate(el => {
    const r = el.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.left >= 0;
  }), 'Header actions fit, including long names');
}
async function contrast(locator) {
  const result = await locator.evaluate(el => {
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = values => values.map(x => { x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
    let ancestor = el, bg = 'rgb(255, 255, 255)';
    while (ancestor) {
      const value = getComputedStyle(ancestor).backgroundColor;
      if (value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') { bg = value; break; }
      ancestor = ancestor.parentElement;
    }
    const style = getComputedStyle(el), a = luminance(rgb(style.color)), b = luminance(rgb(bg));
    return { text: el.textContent.slice(0, 60), color: style.color, background: bg, contrast: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  });
  assert(result.contrast >= 4.5, `Functional copy meets 4.5:1: ${JSON.stringify(result)}`);
  return result;
}
try {
  for (const width of [1440, 390, 320]) {
    for (const role of ['guest', 'user', 'admin']) {
      const ctx = await browser.newContext({ baseURL, viewport: { width, height: 960 }, reducedMotion: 'reduce' });
      if (role !== 'guest') await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), sessions[role]);
      await ctx.route('**/api/**', route => {
        const req = route.request(), pathname = new URL(req.url()).pathname;
        if (role === 'admin' && pathname === '/api/auth/me') return route.fulfill({ status: 200, json: { ...sessions.admin.user, hoTen: 'Quản trị viên Nguyễn Thị Minh Anh có tên rất dài để kiểm tra bố cục' } });
        if (['GET', 'HEAD'].includes(req.method())) return route.continue();
        blockedWrites++;
        return route.fulfill({ status: 503, json: { message: 'UI review blocks database writes.' } });
      });
      const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
      if (role === 'guest') {
        await page.goto('/destinations');
        await expect(page.locator('.catalog-card').first()).toBeVisible();
        await header(page, width); await fit(page);
        await touch(page.locator('.catalog-card .card-bottom a'));
        await expect(page.locator('.catalog-results > span')).toHaveAttribute('role', 'status');
        if (width <= 640) for (const input of await page.locator('.catalog-search input,.catalog-search select').all()) await expect(input).toHaveCSS('font-size', '16px');
        const copy = [];
        for (const selector of ['.catalog-results > span', '.province-filter small', '.catalog-card .card-meta', '.catalog-card .card-bottom small', '.catalog-card figcaption']) {
          const target = page.locator(selector).first(); if (await target.count()) copy.push(await contrast(target));
        }
        metrics.push({ width, surface: 'catalog', copy });
        await shot(page, 'catalog', width);
        await shot(page, 'catalog-card', width, page.locator('.catalog-card').first());
        await page.locator('.catalog-filter-disclosure > summary').click();
        if (width <= 640) for (const input of await page.locator('.catalog-filter-disclosure input,.catalog-filter-disclosure select').all()) await expect(input).toHaveCSS('font-size', '16px');
        checks.push(`catalog-readable-actions-contrast-inputs-${width}`);

        await page.goto(`/hotels/${hotel.maKhachSan}`);
        await expect(page.locator('.gallery-pagination')).toBeVisible();
        await touch(page.locator('.gallery-pagination button')); await fit(page);
        await shot(page, 'gallery-pagination', width, page.locator('.photo-gallery'));
        checks.push(`gallery-touch-targets-${width}`);

        for (const route of ['login', 'register']) {
          await page.goto('/' + route);
          await expect(page.locator('.auth-form')).toBeVisible();
          await header(page, width); await fit(page);
          await touch(page.locator('.auth-home,.auth-submit,.auth-password button,.auth-switch a'));
          metrics.push({ width, surface: route, copy: [await contrast(page.locator('.auth-lead')), await contrast(page.locator('.auth-form label').first())] });
          await shot(page, route, width, page.locator('.auth-panel'));
          await page.locator('.auth-submit').click();
          await expect(page.locator('.form-field-error').first()).toBeVisible();
          await fit(page);
          assert(await page.locator('.auth-page').evaluate(el => el.scrollHeight <= el.clientHeight + 1), 'Long forms use document scrolling, not a clipped inner viewport');
          assert(await page.locator('.auth-submit').evaluate(el => {
            const footer = document.querySelector('.booking-footer');
            return !footer || footer.getBoundingClientRect().top >= el.getBoundingClientRect().bottom;
          }), 'Footer follows the complete form rather than overlapping the submit action');
          await page.locator('.auth-submit').scrollIntoViewIfNeeded();
          await expect(page.locator('.auth-submit')).toBeInViewport();
          if (capture && width <= 600) await page.screenshot({ path: path.join(output, `${route}-bottom-${width}.png`) });
          await shot(page, `${route}-errors`, width, page.locator('.auth-panel'));
        }
        checks.push(`auth-default-and-field-errors-${width}`);
      } else if (role === 'user') {
        await page.goto('/account?tab=hotels');
        await expect(page.locator('.account-tabs')).toBeVisible();
        await header(page, width); await fit(page); await touch(page.locator('.account-tabs button'));
        if (width <= 600) await expect(page.locator('.account-tabs button').first()).toHaveCSS('font-size', '13px');
        await shot(page, 'account', width);
        await shot(page, 'account-tabs', width, page.locator('.account-tabs'));
        checks.push(`account-tabs-fit-and-touch-${width}`);
      } else {
        await page.goto('/destinations');
        await expect(page.locator('.travel-account')).toContainText('Quản trị viên Nguyễn');
        await header(page, width); await fit(page); await shot(page, 'header-long-admin', width, page.locator('.travel-header'));
        await page.goto('/admin/tours');
        await expect(page.locator('.admin-table-wrap tbody tr').first()).toBeVisible();
        const table = page.locator('.admin-table-wrap').first();
        await expect(table).toHaveAttribute('role', 'region');
        await expect(table).toHaveAttribute('tabindex', '0');
        if (width <= 600) {
          assert((await table.evaluate(el => getComputedStyle(el, '::before').content)).includes('Vuốt ngang'), 'Visible table scrolling hint');
          await table.focus(); await page.keyboard.press('End');
          await table.evaluate(el => { el.scrollLeft = el.scrollWidth; });
          await expect(table.getByRole('button', { name: 'Chỉnh sửa', exact: true }).first()).toBeInViewport();
          await shot(page, 'admin-actions', width, table);
          await table.evaluate(el => { el.scrollLeft = 0; });
        }
        await page.locator('.admin-main').evaluate(el => { el.scrollTop = 0; });
        await fit(page); await shot(page, 'admin-table', width);
        checks.push(`admin-long-header-and-table-discovery-${width}`);
      }
      await ctx.close();
    }
  }
  assert.equal(blockedWrites, 0, 'Review did not attempt application writes');
  assert.deepEqual(errors, []);
  const result = { status: 'passed', checks: checks.length, details: checks, browserErrors: errors, databaseWrites: 0, metrics };
  if (capture) fs.writeFileSync(path.join(output, 'metrics.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, metrics: undefined }, null, 2));
} finally { await browser.close(); await client.dispose(); }
