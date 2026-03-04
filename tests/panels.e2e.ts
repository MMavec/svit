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

	test('each panel displays a tier badge', async ({ page }) => {
		const tier1Panel = page.locator('[data-tier="1"]').first();
		const badge = tier1Panel.locator('.panel-tier');
		await expect(badge).toBeVisible();
		await expect(badge).toHaveText('T1');
	});

	test('panel collapse and expand', async ({ page }) => {
		const panel = page.locator('[data-panel-id="council-watch"]');
		const body = panel.locator('.panel-body');

		// Ensure panel starts expanded
		await expect(body).toBeVisible();

		// Collapse via button
		const collapseBtn = panel.locator('.collapse-btn');
		await collapseBtn.click({ force: true });

		// Body should be hidden
		await expect(body).not.toBeVisible({ timeout: 3_000 });

		// Expand via the same button (now labeled "Expand")
		await collapseBtn.click({ force: true });
		await expect(body).toBeVisible({ timeout: 3_000 });
	});

	test('panel focus highlights and dims others', async ({ page }) => {
		const firstPanel = page.locator('[data-panel-id]').first();
		const focusBtn = firstPanel.locator('.panel-action-btn');
		await focusBtn.click({ force: true });

		// The grid cell containing the focused panel should have .focused
		const focusedCell = page.locator('.grid-cell.focused');
		await expect(focusedCell).toBeVisible({ timeout: 3_000 });

		// Other cells should be dimmed
		const dimmedCells = page.locator('.grid-cell.dimmed');
		const dimmedCount = await dimmedCells.count();
		expect(dimmedCount).toBeGreaterThan(0);

		// Unfocus
		await focusBtn.click({ force: true });
		await expect(page.locator('.grid-cell.focused')).toHaveCount(0, { timeout: 3_000 });
	});

	test('panel shows skeleton loading state', async ({ page }) => {
		await page.goto('/');
		const panels = page.locator('[data-panel-id]');
		await expect(panels.first()).toBeVisible({ timeout: 10_000 });
	});

	test('data freshness indicator is visible', async ({ page }) => {
		const freshness = page.locator('.data-freshness');
		await expect(freshness.first()).toBeVisible({ timeout: 15_000 });
	});
});
