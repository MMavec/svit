import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
	});

	test('has a data-theme attribute', async ({ page }) => {
		const html = page.locator('html');
		const theme = await html.getAttribute('data-theme');
		expect(theme === 'dark' || theme === 'light').toBe(true);
	});

	test('toggles theme on click', async ({ page }) => {
		const html = page.locator('html');
		const initial = await html.getAttribute('data-theme');

		const themeBtn = page.locator('.theme-toggle');
		await themeBtn.click();

		const toggled = initial === 'dark' ? 'light' : 'dark';
		await expect(html).toHaveAttribute('data-theme', toggled);
	});

	test('toggles back on second click', async ({ page }) => {
		const html = page.locator('html');
		const initial = await html.getAttribute('data-theme');

		const themeBtn = page.locator('.theme-toggle');
		await themeBtn.click();
		await themeBtn.click();

		await expect(html).toHaveAttribute('data-theme', initial!);
	});

	test('dark theme shows starry sky canvas', async ({ page }) => {
		// Ensure dark mode
		const html = page.locator('html');
		const current = await html.getAttribute('data-theme');
		if (current !== 'dark') {
			await page.locator('.theme-toggle').click();
			await expect(html).toHaveAttribute('data-theme', 'dark');
		}

		const canvas = page.locator('canvas');
		await expect(canvas).toBeVisible();
	});

	test('light theme shows cloudy sky', async ({ page }) => {
		// Ensure light mode
		const html = page.locator('html');
		const current = await html.getAttribute('data-theme');
		if (current !== 'light') {
			await page.locator('.theme-toggle').click();
			await expect(html).toHaveAttribute('data-theme', 'light');
		}

		const clouds = page.locator('.cloud, .cloudy-sky');
		await expect(clouds.first()).toBeVisible({ timeout: 3_000 });
	});

	test('theme persists across reload', async ({ page }) => {
		const html = page.locator('html');
		const initial = await html.getAttribute('data-theme');

		// Toggle to the opposite theme
		const themeBtn = page.locator('.theme-toggle');
		await themeBtn.click();
		const toggled = initial === 'dark' ? 'light' : 'dark';
		await expect(html).toHaveAttribute('data-theme', toggled);

		await page.reload();
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });

		await expect(page.locator('html')).toHaveAttribute('data-theme', toggled);
	});
});
