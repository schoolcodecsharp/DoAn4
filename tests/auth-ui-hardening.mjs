// Browser-only auth outcomes. Every POST is intercepted; no account or SQL data is created.
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, expect } = require('@playwright/test');
const baseURL = process.env.UI_BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch();
const checks = [], errors = [];
let blockedPosts = 0;
const mockUser = { maNguoiDung: 2, maVaiTro: 2, hoTen: 'Người dùng kiểm thử giao diện', email: 'ui-check@example.invalid' };

async function fit(page) {
  assert(await page.locator('.auth-panel').evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1;
  }), 'Auth panel fits without horizontal page overflow');
  for (const input of await page.locator('.auth-form input').all()) await expect(input).toHaveCSS('font-size', '16px');
  for (const control of await page.locator('.auth-submit,.auth-home,.auth-switch a,.auth-password button').all()) {
    const label = await control.textContent();
    await expect.poll(() => control.evaluate(el => el.getBoundingClientRect().height), { message: `Auth action ${label} has a 44px touch height after navigation settles` }).toBeGreaterThanOrEqual(44);
  }
}

try {
  for (const width of [1440, 390, 320]) {
    const ctx = await browser.newContext({ baseURL, viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    let outcome = 'credentials', authenticated = false, loginCalls = 0, registerCalls = 0;
    await ctx.route('**/api/**', route => {
      const req = route.request(), pathname = new URL(req.url()).pathname;
      if (req.method() === 'POST') {
        blockedPosts++;
        if (pathname === '/api/auth/login') {
          loginCalls++;
          if (outcome === 'offline') return route.abort('failed');
          if (outcome === 'modelstate') return route.fulfill({ status: 400, json: { errors: { Email: ['Email này chưa đúng định dạng.'] } } });
          if (outcome === 'rate') return route.fulfill({ status: 429, json: {} });
          if (outcome === 'success') {
            authenticated = true;
            return route.fulfill({ status: 200, json: { token: 'browser-mock-only', user: mockUser } });
          }
          return route.fulfill({ status: 401, json: { message: 'Email hoặc mật khẩu không đúng.' } });
        }
        if (pathname === '/api/auth/register') {
          registerCalls++;
          return outcome === 'success'
            ? route.fulfill({ status: 201, json: { message: 'Tạo tài khoản thành công.' } })
            : route.fulfill({ status: 409, json: { message: 'Email đã được sử dụng.' } });
        }
        return route.fulfill({ status: 503, json: { message: 'Writes blocked by UI regression.' } });
      }
      if (authenticated) return route.fulfill({ status: 200, json: pathname === '/api/auth/me' ? mockUser : pathname === '/api/account' ? { tours: [], hotels: [], trips: [], invitations: [] } : [] });
      return route.continue();
    });
    const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto('/login?returnTo=%2Faccount%3Ftab%3Dhotels');
    const email = page.locator('[name=email]'), password = page.locator('[name=matKhau]');
    await fit(page);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(password).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toBeFocused();
    assert.equal(loginCalls, 0, 'Empty fields never reach the API');
    await expect(page.locator('.form-field-error').last()).toHaveText('Vui lòng nhập hoặc chọn mật khẩu.');
    await email.fill('not-an-email'); await password.fill('not-a-real-password');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    assert.equal(loginCalls, 0);
    await email.fill('ui-check@example.invalid');
    await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click();
    assert.equal(loginCalls, 0, 'Password visibility never submits the form');
    checks.push(`login-client-validation-and-touch-${width}`);

    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.locator('.auth-alert')).toHaveText('Email hoặc mật khẩu không đúng.');
    await expect(password).toHaveValue('not-a-real-password');
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
    await expect(password).not.toHaveAttribute('aria-invalid', 'true');
    outcome = 'modelstate';
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toBeFocused();
    await expect(page.locator('.form-field-error')).toHaveText('Email này chưa đúng định dạng.');
    await email.fill('ui-check-2@example.invalid');
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
    outcome = 'rate';
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.locator('.auth-alert')).toContainText('Bạn thao tác quá nhanh');
    outcome = 'offline';
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.locator('.auth-alert')).toContainText('Chưa kết nối được dịch vụ');
    await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeEnabled();
    await fit(page);
    checks.push(`login-api-errors-and-recovery-${width}`);

    await page.getByRole('link', { name: 'Đăng ký miễn phí', exact: true }).click();
    await expect(page).toHaveURL(/\/register\?returnTo=%2Faccount%3Ftab%3Dhotels/);
    await expect(page.getByRole('heading', { name: 'Tạo tài khoản', exact: true })).toBeVisible();
    await fit(page);
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(page.locator('[name=hoTen]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('[name=hoTen]')).toBeFocused();
    assert.equal(registerCalls, 0);
    await page.locator('[name=hoTen]').fill('Người dùng kiểm thử');
    await email.fill('ui-check@example.invalid'); await password.fill('short');
    await page.locator('[name=confirm]').fill('different'); await page.locator('[name=soDienThoai]').fill('abc');
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    for (const name of ['matKhau', 'confirm', 'soDienThoai']) await expect(page.locator(`[name=${name}]`)).toHaveAttribute('aria-invalid', 'true');
    assert.equal(registerCalls, 0);
    await password.fill('ắ'.repeat(30)); await page.locator('[name=confirm]').fill('ắ'.repeat(30));
    await page.locator('[name=soDienThoai]').fill('0901 234 567');
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(password).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('.form-field-error')).toContainText('72 byte');
    assert.equal(registerCalls, 0, 'UTF-8 byte limit is checked before the API');
    checks.push(`register-client-fields-and-vietnamese-byte-limit-${width}`);

    await password.fill('BrowserMockOnly123!'); await page.locator('[name=confirm]').fill('BrowserMockOnly123!');
    outcome = 'conflict';
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toBeFocused();
    await expect(page.locator('.form-field-error')).toHaveText('Email đã được sử dụng.');
    await expect(page.locator('[name=hoTen]')).toHaveValue('Người dùng kiểm thử');
    await email.fill('ui-check-3@example.invalid');
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('.auth-alert')).toHaveCount(0);
    outcome = 'success';
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(page).toHaveURL(/\/login\?returnTo=%2Faccount%3Ftab%3Dhotels/);
    await expect(page.locator('.auth-notice')).toContainText('Tạo tài khoản thành công');
    await email.fill('ui-check-3@example.invalid'); await password.fill('BrowserMockOnly123!');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(/\/account\?tab=hotels$/);
    await expect(page.locator('.account-tabs')).toBeVisible();
    await expect(page.locator('.travel-account')).toContainText(mockUser.hoTen);
    checks.push(`auth-success-preserves-return-destination-${width}`);
    await ctx.close();
  }
  assert.deepEqual(errors, [], 'No unhandled browser errors');
  console.log(JSON.stringify({ status: 'passed', checks: checks.length, details: checks, interceptedPosts: blockedPosts, databaseWrites: 0, pageErrors: errors }, null, 2));
} finally { await browser.close(); }
