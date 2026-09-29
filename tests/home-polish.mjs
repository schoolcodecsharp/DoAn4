// Read-only homepage regression: no login or database fixtures required.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, expect } = require('@playwright/test');
const browser = await chromium.launch();
const errors = [];
const results = [];
try {
  for (const [name, width, height] of [['desktop', 1440, 960], ['tablet', 820, 1180], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('http://127.0.0.1:5173');
    const home = page.locator('.booking-home'), header = page.locator('.travel-header');
    await expect(header).toHaveClass(/is-hero/);
    await expect(page.getByRole('button', { name: 'Tiếp tục chuyển ảnh' })).toBeVisible();
    await page.locator('.booking-hero__image.is-active').evaluate(img => img.decode());
    await page.screenshot({ path: path.join(root, `.local/home-after-${name}.png`) });
    await home.evaluate(el => el.scrollTo({ top: 500, behavior: 'instant' }));
    await expect(header).toHaveClass(/is-home-scrolled/);
    await expect(header).toHaveCSS('background-color', 'rgb(40, 75, 65)');
    const menuButton = page.getByRole('button', { name: 'Mở menu' });
    await menuButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').evaluate(el => { el.scrollTop = 100; el.dispatchEvent(new Event('scroll')); });
    await expect(header).toHaveClass(/is-home-scrolled/);
    await page.keyboard.press('Escape');
    await expect(menuButton).toBeFocused();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    for (const [section, selector] of [['story', '.home-story'], ['services', '.booking-services'], ['destinations', '.booking-featured'], ['footer', '.booking-cta']]) {
      await page.locator(selector).evaluate(el => { document.querySelector('.booking-home').scrollTo({ top: el.offsetTop - 110, behavior: 'instant' }); });
      await page.locator(selector).locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
      await page.screenshot({ path: path.join(root, `.local/home-after-${section}-${name}.png`) });
      assert(await home.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${name}: horizontal overflow`);
    }
    for (const [label, route] of [['Xem tour', '/tours'], ['Tìm phòng', '/hotels'], ['Xem nhà hàng', '/restaurants'], ['Tạo lịch trình', '/planner']]) {
      const link = page.locator('.home-service-links a').filter({ hasText: label });
      await expect(link).toHaveAttribute('href', route);
    }
    await page.locator('.home-destination--2').click();
    await expect(page).toHaveURL(/\/destinations\?keyword=/);
    await expect(header).not.toHaveClass(/is-home-scrolled|is-hero/);
    await page.locator('.travel-wordmark').click();
    await expect(header).toHaveClass(/is-hero/);
    await home.evaluate(el => el.scrollTo({ top: 300, behavior: 'instant' }));
    await expect(header).toHaveClass(/is-home-scrolled/);
    await home.evaluate(el => el.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(header).toHaveClass(/is-hero/);
    await page.getByRole('button', { name: 'Ảnh tiếp theo' }).click();
    await expect(page.getByRole('button', { name: 'Xem ảnh 2' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Ảnh trước' }).click();
    await expect(page.getByRole('button', { name: 'Xem ảnh 1' })).toHaveAttribute('aria-pressed', 'true');
    assert(await page.locator('.booking-hero__image').evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0)), `${name}: broken hero image`);
    results.push(`${name}: scroll colors, menu/Escape/focus, route return, slideshow, images, no overflow`);
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ results, browserErrors: errors }, null, 2));
} finally {
  await browser.close();
}
