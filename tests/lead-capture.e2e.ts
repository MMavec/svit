import { test, expect } from '@playwright/test';

test.describe('Lead Capture', () => {
	// Banner appears after 30s delay, so each test needs extra time
	test.setTimeout(80_000);

	test.beforeEach(async ({ page }) => {
		// Clear lead capture state
		await page.goto('/');
		await page.evaluate(() => localStorage.removeItem('svit-lead-capture'));
		await page.reload();
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
	});

	test('banner appears after delay for new visitors', async ({ page }) => {
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });
	});

	test('banner has email input and subscribe button', async ({ page }) => {
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });

		const emailInput = banner.locator('.banner-input');
		await expect(emailInput).toBeVisible();
		await expect(emailInput).toHaveAttribute('type', 'email');

		const submitBtn = banner.locator('.banner-submit');
		await expect(submitBtn).toBeVisible();
	});

	test('banner dismisses when close button is clicked', async ({ page }) => {
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });

		const dismissBtn = banner.locator('button[aria-label="Dismiss"]');
		await dismissBtn.click();

		await expect(banner).not.toBeVisible();
	});

	test('dismissed banner stays hidden on reload', async ({ page }) => {
		test.setTimeout(120_000);
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });

		await banner.locator('button[aria-label="Dismiss"]').click();
		await expect(banner).not.toBeVisible();

		await page.reload();
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });

		// Wait past the banner delay
		await page.waitForTimeout(35_000);
		await expect(banner).not.toBeVisible();
	});

	test('more options link opens lead capture modal', async ({ page }) => {
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });

		const moreLink = banner.locator('.banner-link');
		await moreLink.click();

		const modal = page.locator('[role="dialog"][aria-label="Stay informed"]');
		await expect(modal).toBeVisible();
	});

	test('modal step 1: requires email to proceed', async ({ page }) => {
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });
		await banner.locator('.banner-link').click();

		const modal = page.locator('[role="dialog"][aria-label="Stay informed"]');
		await expect(modal).toBeVisible();

		// Next button should be disabled without email
		const nextBtn = modal.locator('button[type="submit"]');
		await expect(nextBtn).toBeDisabled();

		// Enter email
		const emailInput = modal.locator('input[type="email"]');
		await emailInput.fill('test@example.com');
		await expect(nextBtn).toBeEnabled();
	});

	test('modal navigates through all three steps', async ({ page }) => {
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });
		await banner.locator('.banner-link').click();

		const modal = page.locator('[role="dialog"][aria-label="Stay informed"]');

		// Step 1: Enter email and click Next
		await modal.locator('input[type="email"]').fill('test@example.com');
		await modal.locator('button[type="submit"]').click();

		// Step 2: Connect accounts (skip)
		await expect(modal.locator('h2')).toContainText('Connect Your Accounts');
		await modal.locator('button', { hasText: 'Skip' }).click();

		// Step 3: Preferences
		await expect(modal.locator('h2')).toContainText('Your Preferences');
	});

	test('modal step 3: interest chips toggle on click', async ({ page }) => {
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });
		await banner.locator('.banner-link').click();

		const modal = page.locator('[role="dialog"][aria-label="Stay informed"]');

		// Navigate to step 3
		await modal.locator('input[type="email"]').fill('test@example.com');
		await modal.locator('button[type="submit"]').click();
		await modal.locator('button', { hasText: 'Skip' }).click();

		// Click an interest chip
		const chip = modal.locator('.interest-chip').first();
		await chip.click();
		await expect(chip).toHaveClass(/selected/);

		// Click again to deselect
		await chip.click();
		await expect(chip).not.toHaveClass(/selected/);
	});

	test('modal step 3: privacy consent is required to submit', async ({ page }) => {
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });
		await banner.locator('.banner-link').click();

		const modal = page.locator('[role="dialog"][aria-label="Stay informed"]');

		// Navigate to step 3
		await modal.locator('input[type="email"]').fill('test@example.com');
		await modal.locator('button[type="submit"]').click();
		await modal.locator('button', { hasText: 'Skip' }).click();

		// Submit button should be disabled without privacy consent
		const submitBtn = modal.locator('button', { hasText: 'Submit' });
		await expect(submitBtn).toBeDisabled();

		// Check privacy consent
		const privacyCheckbox = modal.locator('.consent-label input[type="checkbox"]').first();
		await privacyCheckbox.check();
		await expect(submitBtn).toBeEnabled();
	});

	test('modal closes with close button', async ({ page }) => {
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });
		await banner.locator('.banner-link').click();

		const modal = page.locator('[role="dialog"][aria-label="Stay informed"]');
		await expect(modal).toBeVisible();

		await modal.locator('button[aria-label="Close"]').click();
		await expect(modal).not.toBeVisible();
	});

	test('modal closes with Escape key', async ({ page }) => {
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });
		await banner.locator('.banner-link').click();

		const modal = page.locator('[role="dialog"][aria-label="Stay informed"]');
		await expect(modal).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(modal).not.toBeVisible();
	});

	test('privacy policy modal opens from step 3', async ({ page }) => {
		const banner = page.locator('.lead-banner');
		await expect(banner).toBeVisible({ timeout: 35_000 });
		await banner.locator('.banner-link').click();

		const modal = page.locator('[role="dialog"][aria-label="Stay informed"]');

		// Navigate to step 3
		await modal.locator('input[type="email"]').fill('test@example.com');
		await modal.locator('button[type="submit"]').click();
		await modal.locator('button', { hasText: 'Skip' }).click();

		// Click privacy policy link
		await modal.locator('.link-btn').click();

		const privacyModal = page.locator('[role="dialog"][aria-label="Privacy Policy"]');
		await expect(privacyModal).toBeVisible();
	});
});
