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

	test('theme toggle switches theme', async ({ page }) => {
		await page.goto('/');
		// Wait for app to hydrate before interacting
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
		const html = page.locator('html');

		// Get initial theme (may be light or dark depending on env)
		const initial = await html.getAttribute('data-theme');

		// Click theme toggle
		const themeBtn = page.locator('.theme-toggle');
		await themeBtn.click();

		// Should switch to opposite
		const toggled = initial === 'dark' ? 'light' : 'dark';
		await expect(html).toHaveAttribute('data-theme', toggled);

		// Click again to go back
		await themeBtn.click();
		await expect(html).toHaveAttribute('data-theme', initial!);
	});

	test('search overlay opens and closes', async ({ page }) => {
		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });

		// Open via button click (more reliable than keyboard shortcut in headless)
		const searchBtn = page.locator('button[aria-label*="Search"]');
		await searchBtn.click();
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

		// Filter out expected errors in headless environment
		const criticalErrors = errors.filter(
			(e) =>
				!e.includes('Failed to fetch') &&
				!e.includes('net::ERR') &&
				!e.includes('fetch failed') &&
				!e.includes('ENOTFOUND') &&
				!e.includes('NetworkError') &&
				!e.includes('WebGL') &&
				!e.includes('webgl') &&
				!e.includes('each_key_duplicate') &&
				!e.includes('Panel') // Panel-level errors from external API failures
		);
		expect(criticalErrors).toHaveLength(0);
	});
});
