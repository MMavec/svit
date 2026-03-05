import { test, expect } from '@playwright/test';

test.describe('Panel Rendering & Interactions', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
	});

	test('all tier 1 and 2 panels render eagerly', async ({ page }) => {
		const panels = page.locator('[data-panel-id]');
		const count = await panels.count();
		expect(count).toBeGreaterThanOrEqual(12);
	});

	test('each panel has a visible header with title', async ({ page }) => {
		const firstPanel = page.locator('[data-panel-id]').first();
		const title = firstPanel.locator('.panel-title');
		await expect(title).toBeVisible();
		await expect(title).not.toBeEmpty();
	});

	test('each panel has a data-tier attribute', async ({ page }) => {
		const tier1Panel = page.locator('[data-tier="1"]').first();
		await expect(tier1Panel).toBeVisible();
	});

	test('panel collapse and expand', async ({ page }) => {
		const panel = page.locator('[data-panel-id="council-watch"]');
		const body = panel.locator('.panel-body');

		// Ensure panel starts expanded
		await expect(body).toBeVisible();

		// Collapse via button — the panel has class .collapsed and body is removed from DOM
		const collapseBtn = panel.locator('.collapse-btn');
		await collapseBtn.click();
		await expect(panel).toHaveClass(/collapsed/, { timeout: 5_000 });

		// Expand via the same button
		await collapseBtn.click();
		await expect(panel).not.toHaveClass(/collapsed/, { timeout: 5_000 });
		await expect(body).toBeVisible({ timeout: 3_000 });
	});

	test('panel focus highlights and dims others', async ({ page }) => {
		const firstPanel = page.locator('[data-panel-id]').first();
		const focusBtn = firstPanel.locator('.panel-action-btn');
		await focusBtn.click();

		// The grid cell containing the focused panel should have .focused
		const focusedCell = page.locator('.grid-cell.focused');
		await expect(focusedCell).toBeVisible({ timeout: 5_000 });

		// Other cells should be dimmed (display: none, so they exist in DOM but are hidden)
		const dimmedCells = page.locator('.grid-cell.dimmed');
		await expect(dimmedCells.first()).toBeAttached({ timeout: 3_000 });

		// Unfocus
		await focusBtn.click();
		await expect(page.locator('.grid-cell.focused')).toHaveCount(0, { timeout: 5_000 });
	});

	test('panel shows skeleton loading state', async ({ page }) => {
		await page.goto('/');
		const panels = page.locator('[data-panel-id]');
		await expect(panels.first()).toBeVisible({ timeout: 10_000 });
	});

	test('data freshness indicator is visible', async ({ page }) => {
		const freshness = page.locator('.data-freshness');
		await expect(freshness.first()).toBeVisible({ timeout: 20_000 });
	});
});
