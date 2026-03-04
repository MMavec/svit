import { test, expect } from '@playwright/test';

test.describe('Search Overlay', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
	});

	test('opens from search button click', async ({ page }) => {
		const searchBtn = page.locator('button[aria-label*="Search"]').first();
		await searchBtn.click();
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		await expect(overlay).toBeVisible({ timeout: 3_000 });
	});

	test('opens with Ctrl+K shortcut', async ({ page }) => {
		await page.keyboard.press('Control+k');
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		await expect(overlay).toBeVisible({ timeout: 3_000 });
	});

	test('closes with Escape key', async ({ page }) => {
		const searchBtn = page.locator('button[aria-label*="Search"]').first();
		await searchBtn.click();
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		await expect(overlay).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(overlay).not.toBeVisible();
	});

	test('closes when clicking backdrop', async ({ page }) => {
		const searchBtn = page.locator('button[aria-label*="Search"]').first();
		await searchBtn.click();
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		await expect(overlay).toBeVisible();

		await page.locator('.overlay-backdrop').click({ force: true });
		await expect(overlay).not.toBeVisible();
	});

	test('search input receives focus on open', async ({ page }) => {
		const searchBtn = page.locator('button[aria-label*="Search"]').first();
		await searchBtn.click();
		await page.waitForTimeout(300);
		// Scope to the visible dialog
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		const input = overlay.locator('.search-input');
		await expect(input).toBeFocused();
	});

	test('typing a query shows results or status', async ({ page }) => {
		const searchBtn = page.locator('button[aria-label*="Search"]').first();
		await searchBtn.click();
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		const input = overlay.locator('.search-input');
		await expect(input).toBeVisible();
		await input.fill('transit');

		// Wait for results or a status message
		const resultsOrStatus = overlay.locator('.result-item, .search-status');
		await expect(resultsOrStatus.first()).toBeVisible({ timeout: 10_000 });
	});

	test('keyboard navigation works in results', async ({ page }) => {
		const searchBtn = page.locator('button[aria-label*="Search"]').first();
		await searchBtn.click();
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		const input = overlay.locator('.search-input');
		await input.fill('council');

		// Wait for results
		const results = overlay.locator('.result-item');
		await results.first().waitFor({ timeout: 10_000 });

		// Press ArrowDown to select first result
		await page.keyboard.press('ArrowDown');
		const activeResult = overlay.locator('.result-item.active');
		await expect(activeResult).toBeVisible();
	});
});
