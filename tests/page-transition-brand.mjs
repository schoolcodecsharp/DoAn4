// Read-only browser checks: public GET requests only, no database fixtures.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, expect } = require('@playwright/test');
const baseURL = process.env.UI_BASE_URL || 'http://127.0.0.1:5173';
const output = path.join(root, '.impeccable/review/page-transition-brand');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const checks = [], errors = [];
async function setTime(page, time) {
  await page.evaluate(time => document.getAnimations().filter(a => a.effect?.target?.closest?.('.route-curtain')).forEach(a => { a.pause(); a.currentTime = time; }), time);
}
try {
  for (const width of [1440, 820, 390, 320]) {
    const ctx = await browser.newContext({ baseURL, viewport: { width, height: width > 820 ? 900 : 844 }, reducedMotion: 'no-preference' });
    await ctx.route('**/api/**', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.fulfill({ status: 503, json: { message: 'Read-only UI check' } }));
    const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto('/destinations');
    const curtain = page.locator('.route-curtain');
    await expect(curtain).toHaveCSS('animation-duration', '1.6s');
    await expect(curtain).toHaveAttribute('aria-hidden', 'true');
    await expect(curtain).toHaveCSS('pointer-events', 'none');
    await expect(page.locator('.route-curtain-logo')).toHaveText('NVT');
    await expect(page.locator('.route-curtain-badge')).toHaveText('DU LỊCH');
    await expect(page.locator('.route-curtain-motto')).toHaveText('Mỗi hành trình, một câu chuyện.');
    await page.evaluate(() => document.fonts.ready);
    await setTime(page, 100);
    const first = await page.locator('.route-curtain-letter > span').first().evaluate(el => getComputedStyle(el).transform);
    const last = await page.locator('.route-curtain-letter > span').last().evaluate(el => getComputedStyle(el).transform);
    assert.notEqual(first, last, 'Letters enter in sequence');
    if ([1440, 390].includes(width)) await page.screenshot({ path: path.join(output, `opening-${width}.png`) });
    await setTime(page, 650);
    const layout = await page.evaluate(() => {
      const brand = document.querySelector('.route-curtain-brand');
      const r = brand.getBoundingClientRect();
      const logo = getComputedStyle(document.querySelector('.route-curtain-logo'));
      const motto = getComputedStyle(document.querySelector('.route-curtain-motto'));
      const visible = [...document.querySelectorAll('.route-curtain-letter > span')].every(el => new DOMMatrix(getComputedStyle(el).transform).m42 === 0);
      return { fontSize: parseFloat(logo.fontSize), mottoSize: parseFloat(motto.fontSize), visible, fits: r.left >= 20 && r.right <= innerWidth - 20 && r.top >= 0 && r.bottom <= innerHeight };
    });
    assert(layout.fontSize >= 96 && layout.mottoSize >= 17, 'Brand copy is readable at every viewport');
    assert(layout.visible && layout.fits, 'Full logo and Vietnamese motto fit without clipping');
    await page.screenshot({ path: path.join(output, `brand-${width}.png`) });
    await setTime(page, 1100);
    const bottom = await curtain.evaluate(el => el.getBoundingClientRect().bottom);
    assert(bottom > 0 && bottom < await page.evaluate(() => innerHeight), 'Curtain progressively reveals destination page');
    if ([1440, 390].includes(width)) await page.screenshot({ path: path.join(output, `exit-${width}.png`) });
    await setTime(page, 1600);
    assert(await curtain.evaluate(el => el.getBoundingClientRect().bottom <= 0), 'Curtain clears within original 1.6s budget');
    await page.evaluate(() => { window.__curtain = document.querySelector('.route-curtain'); });
    await page.getByRole('textbox', { name: 'Bạn muốn đến đâu?', exact: true }).fill('Hạ Long');
    await page.locator('.catalog-search').getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
    await expect(page).toHaveURL(/keyword=/);
    assert(await page.evaluate(() => window.__curtain === document.querySelector('.route-curtain')), 'Filtering does not replay brand');
    await page.locator('.booking-footer a[href="/tours"]').click();
    await expect.poll(() => page.evaluate(() => window.__curtain !== document.querySelector('.route-curtain'))).toBe(true);
    await expect(page.locator('.route-curtain')).toHaveCount(1);
    // A second navigation interrupts the first without stacking curtains.
    await page.evaluate(() => { window.__curtain = document.querySelector('.route-curtain'); });
    await page.locator('.booking-footer a[href="/hotels"]').click();
    await expect(page).toHaveURL(new URL('/hotels', baseURL).href);
    await expect.poll(() => page.evaluate(() => window.__curtain !== document.querySelector('.route-curtain'))).toBe(true);
    await expect(page.locator('.route-curtain')).toHaveCount(1);
    await expect.poll(() => page.locator('.route-curtain').evaluate(el => el.getBoundingClientRect().bottom <= 0)).toBe(true);
    assert(await page.locator('.route-curtain').evaluate(el => el.getBoundingClientRect().bottom <= 0));
    await page.getByRole('textbox', { name: 'Bạn muốn đến đâu?', exact: true }).focus();
    await expect(page.getByRole('textbox', { name: 'Bạn muốn đến đâu?', exact: true })).toBeFocused();
    checks.push(`${width}px: type/fit, letter sequencing, reveal/exit, query no-replay, rapid navigation and keyboard`);
    await ctx.close();
  }
  const reduced = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await reduced.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto('/destinations'); await expect(page.locator('.route-curtain')).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  checks.push('Reduced motion: no curtain, content immediately available');
  await reduced.close(); assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: checks.length, pageErrors: errors, checks }, null, 2));
} finally { await browser.close(); }
