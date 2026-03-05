import { test, expect } from '@playwright/test';

test.describe('Search Overlay', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
	});

	test('opens from search button click', async ({ page }) => {
		await page.evaluate(() => {
			(document.querySelector('button[aria-label*="Search"]') as HTMLElement)?.click();
		});
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		await expect(overlay).toBeVisible({ timeout: 5_000 });
	});

	test('opens with Ctrl+K shortcut', async ({ page }) => {
		await page.keyboard.press('Control+k');
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		await expect(overlay).toBeVisible({ timeout: 5_000 });
	});

	test('closes with Escape key', async ({ page }) => {
		await page.keyboard.press('Control+k');
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		await expect(overlay).toBeVisible({ timeout: 5_000 });

		await page.keyboard.press('Escape');
		await expect(overlay).not.toBeVisible({ timeout: 3_000 });
	});

	test('closes when clicking backdrop', async ({ page }) => {
		await page.keyboard.press('Control+k');
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		await expect(overlay).toBeVisible({ timeout: 5_000 });

		// Dispatch click directly on the backdrop element (Svelte 5 delegation requires bubbling)
		await page.evaluate(() => {
			const backdrop = document.querySelector('.overlay-backdrop');
			if (backdrop) {
				backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
			}
		});
		await expect(overlay).not.toBeVisible({ timeout: 3_000 });
	});

	test('search input receives focus on open', async ({ page }) => {
		await page.keyboard.press('Control+k');
		await page.waitForTimeout(300);
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		const input = overlay.locator('.search-input');
		await expect(input).toBeFocused({ timeout: 3_000 });
	});

	test('typing a query shows results or status', async ({ page }) => {
		await page.keyboard.press('Control+k');
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		const input = overlay.locator('.search-input');
		await expect(input).toBeVisible({ timeout: 5_000 });
		await input.fill('transit');

		// Wait for results or a status message
		const resultsOrStatus = overlay.locator('.result-item, .search-status');
		await expect(resultsOrStatus.first()).toBeVisible({ timeout: 10_000 });
	});

	test('keyboard navigation works in results', async ({ page }) => {
		await page.keyboard.press('Control+k');
		const overlay = page.locator('[role="dialog"][aria-label="Search"]');
		const input = overlay.locator('.search-input');
		await expect(input).toBeVisible({ timeout: 5_000 });
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
