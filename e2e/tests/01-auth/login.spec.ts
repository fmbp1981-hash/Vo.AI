import { test, expect } from '@playwright/test';
import { ROUTES, SELECTORS, TEST_USERS, TEST_TIMEOUTS } from '../../utils/test-data';
import { waitForPageLoad, waitForToast, isAuthenticated } from '../../utils/test-helpers';

test.describe('Login Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(ROUTES.login);
    });

    test('should display login page correctly', async ({ page }) => {
        // Verify page title
        await expect(page).toHaveTitle(/Login|Entrar|Vo\.AI/i);

        // Verify login form elements are present
        await expect(page.locator(SELECTORS.emailInput)).toBeVisible();
        await expect(page.locator(SELECTORS.passwordInput)).toBeVisible();
        await expect(page.locator(SELECTORS.loginButton)).toBeVisible();
    });

    test('should show validation error for empty fields', async ({ page }) => {
        // Try to submit without filling fields
        await page.click(SELECTORS.loginButton);

        // Check for validation messages
        const emailInput = page.locator(SELECTORS.emailInput);
        const passwordInput = page.locator(SELECTORS.passwordInput);

        // Verify HTML5 validation or error messages
        const emailError = await emailInput.getAttribute('aria-invalid');
        const passwordError = await passwordInput.getAttribute('aria-invalid');

        expect(emailError === 'true' || passwordError === 'true').toBeTruthy();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        // Fill in valid credentials
        await page.fill(SELECTORS.emailInput, TEST_USERS.admin.email);
        await page.fill(SELECTORS.passwordInput, TEST_USERS.admin.password);

        // Submit the form
        await page.click(SELECTORS.loginButton);

        // Wait for navigation to dashboard
        await page.waitForURL('**/', { timeout: TEST_TIMEOUTS.navigation });

        // Verify we're authenticated
        expect(await isAuthenticated(page)).toBeTruthy();

        // Verify dashboard loaded
        await waitForPageLoad(page);
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('/auth/login');
    });

    test('should show error for invalid credentials', async ({ page }) => {
        // Fill in invalid credentials
        await page.fill(SELECTORS.emailInput, TEST_USERS.invalidUser.email);
        await page.fill(SELECTORS.passwordInput, TEST_USERS.invalidUser.password);

        // Submit the form
        await page.click(SELECTORS.loginButton);

        // Wait a bit for error to appear
        await page.waitForTimeout(2000);

        // Should still be on login page
        expect(page.url()).toContain('/auth/login');

        // Should show error message (toast or inline)
        const errorVisible = await page.locator('text=/erro|inválid|incorrect|wrong/i').isVisible().catch(() => false);
        expect(errorVisible).toBeTruthy();
    });

    test('should validate email format', async ({ page }) => {
        // Enter invalid email format
        await page.fill(SELECTORS.emailInput, 'invalid-email');
        await page.fill(SELECTORS.passwordInput, 'SomePassword123');

        // Try to submit
        await page.click(SELECTORS.loginButton);

        // Check for email validation
        const emailInput = page.locator(SELECTORS.emailInput);
        const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);

        expect(validationMessage).toBeTruthy();
    });

    test('should toggle password visibility', async ({ page }) => {
        const passwordInput = page.locator(SELECTORS.passwordInput);
        await passwordInput.fill('TestPassword123');

        // Check initial type
        let inputType = await passwordInput.getAttribute('type');
        expect(inputType).toBe('password');

        // Look for toggle button (eye icon)
        const toggleButton = page.locator('button:near(:text-is("password")), [data-testid="toggle-password"], button:has(svg)').first();

        if (await toggleButton.isVisible()) {
            await toggleButton.click();

            // Check type changed
            inputType = await passwordInput.getAttribute('type');
            expect(inputType).toBe('text');
        }
    });

    test('should persist session after page reload', async ({ page, context }) => {
        // Login
        await page.fill(SELECTORS.emailInput, TEST_USERS.admin.email);
        await page.fill(SELECTORS.passwordInput, TEST_USERS.admin.password);
        await page.click(SELECTORS.loginButton);

        // Wait for successful login
        await page.waitForURL('**/', { timeout: TEST_TIMEOUTS.navigation });

        // Reload page
        await page.reload();
        await waitForPageLoad(page);

        // Should still be authenticated
        expect(await isAuthenticated(page)).toBeTruthy();
    });

    test('should navigate to register page if link exists', async ({ page }) => {
        const registerLink = page.locator('a:has-text("Cadastr"), a:has-text("Registr"), a:has-text("Sign up")').first();

        if (await registerLink.isVisible()) {
            await registerLink.click();

            // Should navigate to register page
            await page.waitForURL(/register|cadastro|signup/i, { timeout: TEST_TIMEOUTS.medium });
        } else {
            // Skip test if register link doesn't exist
            test.skip();
        }
    });

    test('should have proper accessibility attributes', async ({ page }) => {
        // Check for form labels
        const emailInput = page.locator(SELECTORS.emailInput);
        const passwordInput = page.locator(SELECTORS.passwordInput);

        // Verify inputs have labels or aria-label
        const emailLabel = await emailInput.getAttribute('aria-label') ||
            await page.locator(`label[for="${await emailInput.getAttribute('id')}"]`).textContent();
        const passwordLabel = await passwordInput.getAttribute('aria-label') ||
            await page.locator(`label[for="${await passwordInput.getAttribute('id')}"]`).textContent();

        expect(emailLabel).toBeTruthy();
        expect(passwordLabel).toBeTruthy();
    });
});
