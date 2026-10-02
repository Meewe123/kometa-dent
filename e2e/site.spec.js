import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Fails the test on any uncaught error or console error in the page. */
function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('status of 404')) errors.push(msg.text());
  });
  return errors;
}

test('home page renders without errors or horizontal scroll', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('круглосуточно');
  await expect(page.locator('[data-clock]')).toHaveText(/^\d{2}:\d{2}$/);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
  expect(errors).toEqual([]);
});

for (const path of ['/', '/uz/', '/admin', '/missing-page']) {
  test(`has no detectable accessibility violations: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

test('books an appointment end to end', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  const form = page.locator('#booking-form');

  // Submitting an empty form shows inline errors and focuses the first field.
  await form.getByRole('button', { name: 'Записаться' }).click();
  await expect(page.locator('#f-service-error')).toHaveText('Выберите услугу');
  await expect(page.locator('#f-service')).toBeFocused();

  await page.selectOption('#f-service', 'implants');
  // Tomorrow is always inside the booking window; demo data books 09:30 there.
  await form.locator('input[name="date"]').nth(1).check();
  await expect(form.locator('input[name="time"][value="09:30"]')).toBeDisabled();
  // Both browser projects share one demo server, so take whichever slot is still free.
  const slot = form.locator('input[name="time"]:not([disabled])').first();
  const time = await slot.getAttribute('value');
  await slot.check();
  await page.fill('#f-name', 'Тест Тестович');
  await page.fill('#f-phone', '90 123 45 67');

  const submit = form.locator('[data-submit]');
  await expect(submit).toContainText(time);
  await submit.click();

  const done = page.locator('[data-done]');
  await expect(done).toBeVisible();
  await expect(done).toContainText('+998 90 123 45 67');
  await expect(done).toContainText('демо-версия');

  // The slot is now taken for everyone else.
  await page.getByRole('button', { name: 'Записать ещё одного человека' }).click();
  await expect(form.locator(`input[name="time"][value="${time}"]`)).toBeDisabled();
  expect(errors).toEqual([]);
});

test('switches language', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Меню' }).click();
  await page.locator('.lang-switch a[hreflang="uz"]:visible').click();
  await expect(page).toHaveURL(/\/uz\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'uz');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('kechayu kunduz');
});

test('mobile menu opens after scrolling and closes with Escape', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'menu button exists only on small screens');
  await page.goto('/');
  await page.mouse.wheel(0, 2500);
  await page.getByRole('button', { name: 'Меню' }).click();
  const menu = page.locator('#menu');
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  expect(box.height).toBeGreaterThan(600);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('admin signs in and confirms an appointment', async ({ page }) => {
  await page.goto('/admin');
  await page.fill('#token', 'wrong');
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page.locator('[data-login-error]')).toHaveText('Неверный токен');

  await page.fill('#token', 'demo');
  await page.getByRole('button', { name: 'Войти' }).click();
  const firstPending = page.locator('.row--pending').first();
  await expect(firstPending).toBeVisible();
  const time = await firstPending.locator('.row__time').textContent();
  await firstPending.getByRole('button', { name: 'Подтвердить' }).click();
  await expect(
    page.locator('.row--confirmed', { has: page.locator('.row__time', { hasText: time }) }).first(),
  ).toBeVisible();
});
