import { test, expect } from '@playwright/test';

test.describe('Bookmarks', () => {
	test.beforeEach(async ({ page }) => {
		// Clear localStorage bookmarks before each test
		await page.goto('/');
		await page.evaluate(() => localStorage.removeItem('svit-bookmarks'));
		await page.reload();
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
	});

	test('bookmarks flyout opens on header button click', async ({ page }) => {
		const bookmarkBtn = page.locator('.bookmark-header-btn');
		await bookmarkBtn.click();

		const flyout = page.locator('.bookmarks-flyout');
		await expect(flyout).toBeVisible();
	});

	test('flyout shows empty state when no bookmarks', async ({ page }) => {
		const bookmarkBtn = page.locator('.bookmark-header-btn');
		await bookmarkBtn.click();

		const emptyMsg = page.locator('.flyout-empty');
		await expect(emptyMsg).toBeVisible();
	});

	test('flyout closes when clicking outside', async ({ page }) => {
		const bookmarkBtn = page.locator('.bookmark-header-btn');
		await bookmarkBtn.click();
		await expect(page.locator('.bookmarks-flyout')).toBeVisible();

		// Click outside (on a panel area)
		await page.locator('.dashboard-grid').click({ force: true });
		await expect(page.locator('.bookmarks-flyout')).not.toBeVisible();
	});

	test('bookmark button on item saves to bookmarks', async ({ page }) => {
		// Find a bookmark button inside a panel
		const bookmarkItemBtn = page.locator('.bookmark-btn').first();
		if (await bookmarkItemBtn.isVisible()) {
			await bookmarkItemBtn.click();
			await expect(bookmarkItemBtn).toHaveClass(/saved/);

			// Badge should appear on header button
			const badge = page.locator('.bookmark-badge');
			await expect(badge).toBeVisible();
		}
	});

	test('bookmarks persist across page reload', async ({ page }) => {
		const bookmarkItemBtn = page.locator('.bookmark-btn').first();
		if (await bookmarkItemBtn.isVisible()) {
			await bookmarkItemBtn.click();
			await expect(bookmarkItemBtn).toHaveClass(/saved/);

			await page.reload();
			await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });

			const badge = page.locator('.bookmark-badge');
			await expect(badge).toBeVisible();
		}
	});

	test('removing bookmark from flyout updates count', async ({ page }) => {
		const bookmarkItemBtn = page.locator('.bookmark-btn').first();
		if (await bookmarkItemBtn.isVisible()) {
			// Add a bookmark
			await bookmarkItemBtn.click();

			// Open flyout
			const headerBtn = page.locator('.bookmark-header-btn');
			await headerBtn.click();

			const flyout = page.locator('.bookmarks-flyout');
			await expect(flyout).toBeVisible();

			// Remove from flyout
			const removeBtn = flyout.locator('[aria-label="Remove bookmark"]').first();
			await removeBtn.click();

			// Should show empty or no badge
			await expect(page.locator('.bookmark-badge')).not.toBeVisible();
		}
	});
});
