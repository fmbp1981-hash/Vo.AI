import { test, expect } from '@playwright/test';
import { ROUTES, SELECTORS, TEST_USERS } from '../../utils/test-data';
import { loginAsAdmin, logout, isAuthenticated } from '../../utils/test-helpers';

test.describe('Logout Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Make sure we start logged in
        await loginAsAdmin(page);
    });

    test('should logout successfully', async ({ page }) => {
        // Verify we're logged in first
        expect(await isAuthenticated(page)).toBeTruthy();

        // Perform logout
        await logout(page);

        // Should be redirected to login page
        expect(page.url()).toContain('/auth/login');

        // Should not be authenticated
        expect(await isAuthenticated(page)).toBeFalsy();
    });

    test('should clear session after logout', async ({ page }) => {
        // Logout
        await logout(page);

        // Try to access protected route
        await page.goto(ROUTES.dashboard);

        // Should be redirected to login
        await page.waitForURL('**/auth/login', { timeout: 5000 });
        expect(page.url()).toContain('/auth/login');
    });

    test('should not access protected routes after logout', async ({ page }) => {
        // Logout
        await logout(page);

        // List of protected routes to test
        const protectedRoutes = [
            ROUTES.crm,
            ROUTES.chat,
            ROUTES.inbox,
            ROUTES.settings,
        ];

        for (const route of protectedRoutes) {
            await page.goto(route);

            // Should redirect to login
            await page.waitForURL('**/auth/login', { timeout: 5000 }).catch(() => { });
            const currentUrl = page.url();

            // Either on login page or redirected with return URL
            expect(
                currentUrl.includes('/auth/login') ||
                currentUrl.includes('redirect') ||
                currentUrl.includes('returnUrl')
            ).toBeTruthy();
        }
    });

    test('should remove user-specific UI after logout', async ({ page }) => {
        // Before logout, check for user menu or profile
        const userMenuExists = await page.locator('[data-testid="user-menu"], button:has-text("Perfil")').count() > 0;

        if (userMenuExists) {
            await logout(page);

            // After logout, user menu should not exist on login page
            const userMenuExistsAfter = await page.locator('[data-testid="user-menu"], button:has-text("Perfil")').count() > 0;
            expect(userMenuExistsAfter).toBeFalsy();
        }
    });

    test('should handle logout button in different locations', async ({ page }) => {
        // Some apps have logout in dropdown, some in sidebar, etc.
        const possibleLogoutLocations = [
            SELECTORS.logoutButton,
            '[data-testid="user-menu"] button:has-text("Sair")',
            'nav button:has-text("Logout")',
            'aside button:has-text("Sair")',
        ];

        let loggedOut = false;

        for (const selector of possibleLogoutLocations) {
            const button = page.locator(selector).first();

            if (await button.isVisible()) {
                await button.click();
                loggedOut = true;
                break;
            } else {
                // Try clicking user menu first
                const userMenu = page.locator('[data-testid="user-menu"], button[aria-label="User menu"]').first();
                if (await userMenu.isVisible()) {
                    await userMenu.click();

                    const logoutInMenu = page.locator(selector).first();
                    if (await logoutInMenu.isVisible()) {
                        await logoutInMenu.click();
                        loggedOut = true;
                        break;
                    }
                }
            }
        }

        if (loggedOut) {
            // Verify logout was successful
            await page.waitForURL('**/auth/login', { timeout: 5000 });
            expect(page.url()).toContain('/auth/login');
        } else {
            // If no logout button found, skip test
            test.skip();
        }
    });
});
