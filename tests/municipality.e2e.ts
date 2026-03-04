import { test, expect } from '@playwright/test';

test.describe('Municipality Selection', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });
	});

	test('municipality selector is visible', async ({ page }) => {
		const trigger = page.locator('.selector-trigger');
		await expect(trigger).toBeVisible();
	});

	test('dropdown opens and shows all municipalities', async ({ page }) => {
		const trigger = page.locator('.selector-trigger');
		await trigger.click();

		const dropdown = page.locator('[role="listbox"]');
		await expect(dropdown).toBeVisible();

		const options = dropdown.locator('[role="option"]');
		const count = await options.count();
		// At least "All CRD" + a few municipalities
		expect(count).toBeGreaterThanOrEqual(5);
	});

	test('selecting a municipality updates the selector', async ({ page }) => {
		const trigger = page.locator('.selector-trigger');
		await trigger.click();

		// Use getByRole with exact name to avoid ambiguity
		const victoriaOption = page.getByRole('option', { name: 'Victoria VIC' });
		await victoriaOption.click();

		// Dropdown should close
		await expect(page.locator('[role="listbox"]')).not.toBeVisible();

		// Trigger should show Victoria (full name)
		await expect(trigger).toContainText('Victoria');
	});

	test('selection updates URL parameter', async ({ page }) => {
		const trigger = page.locator('.selector-trigger');
		await trigger.click();

		const victoriaOption = page.getByRole('option', { name: 'Victoria VIC' });
		await victoriaOption.click();

		// URL should contain m=victoria
		await expect(page).toHaveURL(/[?&]m=victoria/);
	});

	test('URL parameter m= loads correct municipality', async ({ page }) => {
		await page.goto('/?m=saanich');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });

		const trigger = page.locator('.selector-trigger');
		await expect(trigger).toContainText('Saanich');
	});

	test('selecting All CRD clears the municipality URL param', async ({ page }) => {
		// Start with a municipality selected
		await page.goto('/?m=victoria');
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });

		const trigger = page.locator('.selector-trigger');
		await trigger.click();

		const allCrdOption = page.locator('[role="option"]').first();
		await allCrdOption.click();

		// URL should not have m= or m should be empty
		const url = page.url();
		expect(url).not.toMatch(/[?&]m=\w/);
	});

	test('municipality selection persists across page reload', async ({ page }) => {
		const trigger = page.locator('.selector-trigger');
		await trigger.click();
		await page.getByRole('option', { name: 'Victoria VIC' }).click();

		// Reload
		await page.reload();
		await page.locator('[data-panel-id]').first().waitFor({ timeout: 10_000 });

		// Should still show Victoria
		await expect(page.locator('.selector-trigger')).toContainText('Victoria');
	});
});
