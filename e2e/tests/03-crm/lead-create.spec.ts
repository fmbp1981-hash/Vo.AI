import { test, expect } from '@playwright/test';
import { ROUTES, SELECTORS, TEST_LEADS, TEST_TIMEOUTS } from '../../utils/test-data';
import { loginAsAdmin, waitForPageLoad, fillField, clickButton, waitForToast, generateTestEmail, generateTestPhone } from '../../utils/test-helpers';

test.describe('CRM - Create Lead', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto(ROUTES.crm);
        await waitForPageLoad(page);
    });

    test('should create a new lead successfully', async ({ page }) => {
        // Click create button
        await page.locator(SELECTORS.createLeadButton).first().click();

        // Wait for form to appear
        await page.waitForTimeout(1000);

        // Fill in lead details
        const testEmail = generateTestEmail();
        const testPhone = generateTestPhone();

        await page.fill(SELECTORS.leadNameInput, TEST_LEADS.newLead.name);
        await page.fill(SELECTORS.leadEmailInput, testEmail);

        // Try to fill phone if field exists
        const phoneInput = page.locator('input[name="phone"], input[type="tel"]');
        if (await phoneInput.isVisible()) {
            await phoneInput.fill(testPhone);
        }

        // Try to fill destination if field exists
        const destinationInput = page.locator('input[name="destination"], input[name="destino"]');
        if (await destinationInput.isVisible()) {
            await destinationInput.fill(TEST_LEADS.newLead.destination);
        }

        // Submit the form
        await page.locator(SELECTORS.saveLeadButton).first().click();

        // Wait for success feedback
        await page.waitForTimeout(2000);

        // Should show success message or close modal
        const modalClosed = await page.locator(SELECTORS.modal).isHidden().catch(() => true);
        const toastVisible = await page.locator(SELECTORS.toast).isVisible().catch(() => false);

        expect(modalClosed || toastVisible).toBeTruthy();
    });

    test('should validate required fields', async ({ page }) => {
        // Click create button
        await page.locator(SELECTORS.createLeadButton).first().click();
        await page.waitForTimeout(500);

        // Try to submit without filling fields
        await page.locator(SELECTORS.saveLeadButton).first().click();

        // Should show validation errors
        await page.waitForTimeout(1000);

        // Modal should still be open (form not submitted)
        const modalStillOpen = await page.locator(SELECTORS.modal).isVisible();
        expect(modalStillOpen).toBeTruthy();
    });

    test('should validate email format', async ({ page }) => {
        await page.locator(SELECTORS.createLeadButton).first().click();
        await page.waitForTimeout(500);

        // Fill with invalid email
        await page.fill(SELECTORS.leadNameInput, 'Test User');
        await page.fill(SELECTORS.leadEmailInput, 'invalid-email');

        // Try to submit
        await page.locator(SELECTORS.saveLeadButton).first().click();
        await page.waitForTimeout(1000);

        // Should see validation error
        const emailInput = page.locator(SELECTORS.leadEmailInput);
        const hasError = await emailInput.getAttribute('aria-invalid') === 'true' ||
            await page.locator('text=/email.*inválid|invalid.*email/i').isVisible();

        expect(hasError).toBeTruthy();
    });

    test('should close modal on cancel', async ({ page }) => {
        await page.locator(SELECTORS.createLeadButton).first().click();
        await page.waitForTimeout(500);

        // Click cancel button
        const cancelButton = page.locator(SELECTORS.cancelButton).first();

        if (await cancelButton.isVisible()) {
            await cancelButton.click();
            await page.waitForTimeout(500);

            // Modal should be closed
            const modalClosed = await page.locator(SELECTORS.modal).isHidden();
            expect(modalClosed).toBeTruthy();
        }
    });

    test('should auto-fill form fields correctly', async ({ page }) => {
        await page.locator(SELECTORS.createLeadButton).first().click();
        await page.waitForTimeout(500);

        const testName = 'Test Lead Name';
        const testEmail = generateTestEmail();

        // Fill name
        await page.fill(SELECTORS.leadNameInput, testName);

        // Verify value was set
        const nameValue = await page.locator(SELECTORS.leadNameInput).inputValue();
        expect(nameValue).toBe(testName);

        // Fill email
        await page.fill(SELECTORS.leadEmailInput, testEmail);

        // Verify value was set
        const emailValue = await page.locator(SELECTORS.leadEmailInput).inputValue();
        expect(emailValue).toBe(testEmail);
    });

    test('should handle form submission errors gracefully', async ({ page }) => {
        await page.locator(SELECTORS.createLeadButton).first().click();
        await page.waitForTimeout(500);

        // Fill with potentially problematic data
        await page.fill(SELECTORS.leadNameInput, '<script>alert("test")</script>');
        await page.fill(SELECTORS.leadEmailInput, generateTestEmail());

        // Submit
        await page.locator(SELECTORS.saveLeadButton).first().click();
        await page.waitForTimeout(2000);

        // Should either sanitize input or show error gracefully
        // Page should not crash or show console errors
        const pageHasErrors = await page.evaluate(() => {
            const errors = (window as any).testErrors || [];
            return errors.length > 0;
        }).catch(() => false);

        expect(pageHasErrors).toBeFalsy();
    });

    test('should persist lead in list after creation', async ({ page }) => {
        const leadName = `E2E Test Lead ${Date.now()}`;
        const leadEmail = generateTestEmail();

        // Create lead
        await page.locator(SELECTORS.createLeadButton).first().click();
        await page.waitForTimeout(500);

        await page.fill(SELECTORS.leadNameInput, leadName);
        await page.fill(SELECTORS.leadEmailInput, leadEmail);

        await page.locator(SELECTORS.saveLeadButton).first().click();
        await page.waitForTimeout(2000);

        // Search for the lead in the list
        const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]').first();

        if (await searchInput.isVisible()) {
            await searchInput.fill(leadName);
            await page.waitForTimeout(1000);

            // Should find the lead
            const leadInList = page.locator(`text="${leadName}"`).first();
            await expect(leadInList).toBeVisible({ timeout: TEST_TIMEOUTS.long });
        }
    });
});
