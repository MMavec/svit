import { test, expect } from '@playwright/test';

test.describe('SVIT Dashboard Smoke Tests', () => {
	test('page loads with correct title', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/SVIT/);
	});

	test('dashboard panels render', async ({ page }) => {
		await page.goto('/');
		// Wait for at least some panels to appear
		const panels = page.locator('[data-panel-id]');
		await expect(panels.first()).toBeVisible({ timeout: 10_000 });
		const count = await panels.count();
		expect(count).toBeGreaterThanOrEqual(12); // Tier 1 + 2 at minimum
	});

	test('municipality selector is visible and interactive', async ({ page }) => {
		await page.goto('/');
		const selector = page.locator('.municipality-selector, select, [aria-label*="municipality" i]');
		await expect(selector.first()).toBeVisible({ timeout: 10_000 });
	});

	test('theme toggle switches dark/light', async ({ page }) => {
		await page.goto('/');
		const html = page.locator('html');

		// Start in dark mode (default)
		await expect(html).toHaveAttribute('data-theme', 'dark');

		// Click theme toggle
		const themeBtn = page.locator('[aria-label*="theme" i], [title*="theme" i]');
		await themeBtn.click();

		// Should switch to light
		await expect(html).toHaveAttribute('data-theme', 'light');

		// Click again to go back to dark
		await themeBtn.click();
		await expect(html).toHaveAttribute('data-theme', 'dark');
	});

	test('search overlay opens with Cmd+K and closes with Escape', async ({ page }) => {
		await page.goto('/');

		// Open with Cmd+K
		await page.keyboard.press('Meta+k');
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		await expect(overlay).toBeVisible({ timeout: 3_000 });

		// Close with Escape
		await page.keyboard.press('Escape');
		await expect(overlay).not.toBeVisible();
	});

	test('header is visible with logo', async ({ page }) => {
		await page.goto('/');
		const logo = page.locator('.logo-text');
		await expect(logo).toHaveText('SVIT');
	});

	test('no console errors on load', async ({ page }) => {
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text());
			}
		});

		await page.goto('/');
		await page.waitForTimeout(3_000);

		// Filter out expected network errors from mock/seed API
		const criticalErrors = errors.filter(
			(e) => !e.includes('Failed to fetch') && !e.includes('net::ERR')
		);
		expect(criticalErrors).toHaveLength(0);
	});
});
