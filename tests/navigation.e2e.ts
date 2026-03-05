import { test, expect } from '@playwright/test';

test.describe('Navigation & Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
	});

	test('skip link is focusable and targets main content', async ({ page }) => {
		const skipLink = page.locator('.skip-link');

		// Tab to focus the skip link
		await page.keyboard.press('Tab');
		await expect(skipLink).toBeFocused();
		await expect(skipLink).toHaveAttribute('href', '#main-dashboard');
	});

	test('header is sticky at top', async ({ page }) => {
		const header = page.locator('.app-header');
		await expect(header).toBeVisible();

		// Scroll down
		await page.evaluate(() => window.scrollTo(0, 500));
		await page.waitForTimeout(300);

		// Header should still be visible (sticky)
		await expect(header).toBeVisible();
		await expect(header).toBeInViewport();
	});

	test('panels have correct ARIA region roles', async ({ page }) => {
		const gridCells = page.locator('.grid-cell[role="region"]');
		const count = await gridCells.count();
		expect(count).toBeGreaterThanOrEqual(12);

		// Check first cell has aria-label
		const firstCell = gridCells.first();
		const label = await firstCell.getAttribute('aria-label');
		expect(label).toBeTruthy();
	});

	test('page has correct title', async ({ page }) => {
		await expect(page).toHaveTitle(/SVIT/);
	});

	test('dynamic title updates with municipality selection', async ({ page }) => {
		await page.evaluate(() => {
			(document.querySelector('.selector-trigger') as HTMLElement)?.click();
		});
		await page.getByRole('option', { name: 'Victoria VIC' }).click();

		await expect(page).toHaveTitle(/Victoria.*SVIT/);
	});

	test('mobile layout: panels stack vertically at narrow viewport', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });

		// Grid should have mobile class
		const grid = page.locator('.dashboard-grid');
		await expect(grid).toHaveClass(/mobile/);
	});

	test('mobile layout: more actions menu is visible', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });

		const mobileMenuBtn = page.locator('.mobile-menu-btn');
		await expect(mobileMenuBtn).toBeVisible();
	});

	test('no critical console errors', async ({ page }) => {
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') errors.push(msg.text());
		});

		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
		await page.waitForTimeout(2_000);

		// Filter out expected errors in headless environment
		const criticalErrors = errors.filter(
			(e) =>
				!e.includes('Failed to fetch') &&
				!e.includes('Failed to load resource') &&
				!e.includes('net::ERR') &&
				!e.includes('fetch failed') &&
				!e.includes('ENOTFOUND') &&
				!e.includes('NetworkError') &&
				!e.includes('WebGL') &&
				!e.includes('webgl') &&
				!e.includes('MIME type') &&
				!e.includes('_vercel') &&
				!e.includes('each_key_duplicate') &&
				!e.includes('Panel') // Panel-level errors from external API failures
		);
		expect(criticalErrors).toHaveLength(0);
	});
});
