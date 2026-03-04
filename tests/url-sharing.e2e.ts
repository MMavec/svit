import { test, expect } from '@playwright/test';

test.describe('URL State & Social Sharing', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
	});

	test('municipality param updates URL on selection', async ({ page }) => {
		const trigger = page.locator('.selector-trigger');
		await trigger.click();
		// Use exact option name to avoid matching "North Saanich" etc.
		await page.getByRole('option', { name: 'Esquimalt ESQ' }).click();

		await expect(page).toHaveURL(/[?&]m=esquimalt/);
	});

	test('panel focus param updates URL', async ({ page }) => {
		const panel = page.locator('[data-panel-id="council-watch"]');
		const focusBtn = panel.locator('.panel-action-btn');
		await focusBtn.click({ force: true });

		await expect(page).toHaveURL(/[?&]panel=council-watch/);
	});

	test('panel unfocus removes panel param', async ({ page }) => {
		const panel = page.locator('[data-panel-id="council-watch"]');
		const focusBtn = panel.locator('.panel-action-btn');
		await focusBtn.click({ force: true });
		await expect(page).toHaveURL(/[?&]panel=council-watch/);

		// Unfocus
		await focusBtn.click({ force: true });
		await page.waitForTimeout(500);

		const url = page.url();
		expect(url).not.toMatch(/[?&]panel=\w/);
	});

	test('browser back button unfocuses panel', async ({ page }) => {
		const panel = page.locator('[data-panel-id="council-watch"]');
		const focusBtn = panel.locator('.panel-action-btn');
		await focusBtn.click({ force: true });

		await expect(page.locator('.grid-cell.focused')).toBeVisible({ timeout: 3_000 });

		// Navigate back
		await page.goBack();
		await page.waitForTimeout(500);

		// Panel should be unfocused
		await expect(page.locator('.grid-cell.focused')).toHaveCount(0);
	});

	test('loading URL with m= and panel= sets correct state', async ({ page }) => {
		await page.goto('/?m=victoria&panel=council-watch');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });

		// Municipality should be Victoria
		await expect(page.locator('.selector-trigger')).toContainText('Victoria');

		// Council Watch panel should be focused
		const focused = page.locator('.grid-cell.focused');
		await expect(focused).toBeVisible({ timeout: 3_000 });
	});

	test('share button opens share drawer', async ({ page }) => {
		const shareBtn = page.locator('button[aria-label="Share dashboard"]');
		await shareBtn.click();

		const drawer = page.locator('[role="dialog"][aria-label="Share"]');
		await expect(drawer).toBeVisible();
	});

	test('share drawer has social media options', async ({ page }) => {
		const shareBtn = page.locator('button[aria-label="Share dashboard"]');
		await shareBtn.click();

		const drawer = page.locator('[role="dialog"][aria-label="Share"]');
		await expect(drawer).toBeVisible();

		const options = drawer.locator('.share-option');
		const count = await options.count();
		expect(count).toBeGreaterThanOrEqual(4);
	});

	test('copy link button copies URL', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);

		const shareBtn = page.locator('button[aria-label="Share dashboard"]');
		await shareBtn.click();

		const copyBtn = page.locator('.copy-option');
		await copyBtn.click();

		const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboardText).toContain('/share');
	});

	test('share drawer closes on escape', async ({ page }) => {
		const shareBtn = page.locator('button[aria-label="Share dashboard"]');
		await shareBtn.click();

		const drawer = page.locator('[role="dialog"][aria-label="Share"]');
		await expect(drawer).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(drawer).not.toBeVisible();
	});

	test('share drawer closes on backdrop click', async ({ page }) => {
		const shareBtn = page.locator('button[aria-label="Share dashboard"]');
		await shareBtn.click();

		const drawer = page.locator('[role="dialog"][aria-label="Share"]');
		await expect(drawer).toBeVisible();

		await page.locator('.share-backdrop').click({ force: true });
		await expect(drawer).not.toBeVisible();
	});

	test('/share route has OG meta tags', async ({ page }) => {
		// Go to share route and check meta tags before redirect
		await page.goto('/share?m=victoria&panel=council-watch', {
			waitUntil: 'domcontentloaded'
		});

		// Check the HTML source for OG tags
		const html = await page.content();
		expect(html).toContain('og:title');
		expect(html).toContain('Victoria');
	});

	test('/share route redirects to main app', async ({ page }) => {
		await page.goto('/share?m=victoria');

		// Should redirect to main page with params
		await page.waitForURL('**/?m=victoria*', { timeout: 10_000 });
	});
});
