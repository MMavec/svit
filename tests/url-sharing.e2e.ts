import { test, expect } from '@playwright/test';

test.describe('URL State & Social Sharing', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
	});

	test('municipality param updates URL on selection', async ({ page }) => {
		await page.evaluate(() => {
			(document.querySelector('.selector-trigger') as HTMLElement)?.click();
		});
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

		// Unfocus — the panel is now expanded, find the button again
		await focusBtn.click({ force: true });
		await expect(page).not.toHaveURL(/[?&]panel=\w/, { timeout: 5_000 });
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
		await page.evaluate(() => {
			(document.querySelector('button[aria-label="Share dashboard"]') as HTMLElement)?.click();
		});

		const drawer = page.locator('[role="dialog"][aria-label="Share"]');
		await expect(drawer).toBeVisible();
	});

	test('share drawer has social media options', async ({ page }) => {
		await page.evaluate(() => {
			(document.querySelector('button[aria-label="Share dashboard"]') as HTMLElement)?.click();
		});

		const drawer = page.locator('[role="dialog"][aria-label="Share"]');
		await expect(drawer).toBeVisible();

		const options = drawer.locator('.share-option');
		const count = await options.count();
		expect(count).toBeGreaterThanOrEqual(4);
	});

	test('copy link button copies URL', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);

		await page.evaluate(() => {
			(document.querySelector('button[aria-label="Share dashboard"]') as HTMLElement)?.click();
		});

		const copyBtn = page.locator('.copy-option');
		await copyBtn.click();

		const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboardText).toContain('/share');
	});

	test('share drawer closes on escape', async ({ page }) => {
		await page.evaluate(() => {
			(document.querySelector('button[aria-label="Share dashboard"]') as HTMLElement)?.click();
		});

		const drawer = page.locator('[role="dialog"][aria-label="Share"]');
		await expect(drawer).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(drawer).not.toBeVisible();
	});

	test('share drawer closes on backdrop click', async ({ page }) => {
		await page.evaluate(() => {
			(document.querySelector('button[aria-label="Share dashboard"]') as HTMLElement)?.click();
		});

		const drawer = page.locator('[role="dialog"][aria-label="Share"]');
		await expect(drawer).toBeVisible();

		// Click on backdrop area outside the centered drawer
		await page.mouse.click(10, 10);
		await expect(drawer).not.toBeVisible();
	});

	test('/share route has OG meta tags', async ({ page }) => {
		// Fetch the share route HTML directly to avoid client-side redirect race
		const response = await page.request.get('/share?m=victoria&panel=council-watch');
		const html = await response.text();
		expect(html).toContain('og:title');
		expect(html).toContain('Victoria');
	});

	test('/share route redirects to main app', async ({ page }) => {
		await page.goto('/share?m=victoria');

		// Should redirect to main page with params
		await page.waitForURL('**/?m=victoria*', { timeout: 10_000 });
	});
});
