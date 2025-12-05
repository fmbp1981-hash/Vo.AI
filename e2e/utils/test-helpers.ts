import { Page, expect } from '@playwright/test';
import { ROUTES, SELECTORS, TEST_TIMEOUTS, TEST_USERS } from './test-data';

/**
 * Helper Functions for E2E Tests
 */

/**
 * Perform login with provided credentials
 */
export async function login(page: Page, email: string, password: string) {
    await page.goto(ROUTES.login);
    await page.fill(SELECTORS.emailInput, email);
    await page.fill(SELECTORS.passwordInput, password);
    await page.click(SELECTORS.loginButton);

    // Wait for navigation to complete
    await page.waitForURL('**/', { timeout: TEST_TIMEOUTS.navigation });
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page) {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
}

/**
 * Login as consultant user
 */
export async function loginAsConsultant(page: Page) {
    await login(page, TEST_USERS.consultant.email, TEST_USERS.consultant.password);
}

/**
 * Perform logout
 */
export async function logout(page: Page) {
    // Try to find logout button (might be in a menu)
    const logoutButton = page.locator(SELECTORS.logoutButton).first();

    if (await logoutButton.isVisible()) {
        await logoutButton.click();
    } else {
        // If not visible, try to open user menu first
        const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Perfil")').first();
        if (await userMenu.isVisible()) {
            await userMenu.click();
            await page.locator(SELECTORS.logoutButton).first().click();
        }
    }

    // Wait for redirect to login
    await page.waitForURL('**/auth/login', { timeout: TEST_TIMEOUTS.medium });
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');

    // Also wait for any loading spinners to disappear
    const spinner = page.locator(SELECTORS.loadingSpinner);
    if (await spinner.isVisible()) {
        await spinner.waitFor({ state: 'hidden', timeout: TEST_TIMEOUTS.long });
    }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
    const currentUrl = page.url();
    return !currentUrl.includes('/auth/login');
}

/**
 * Navigate to a route and wait for load
 */
export async function navigateTo(page: Page, route: string) {
    await page.goto(route);
    await waitForPageLoad(page);
}

/**
 * Wait for and verify toast message appears
 */
export async function waitForToast(page: Page, message?: string) {
    const toast = page.locator(SELECTORS.toast).first();
    await expect(toast).toBeVisible({ timeout: TEST_TIMEOUTS.medium });

    if (message) {
        await expect(toast).toContainText(message);
    }

    return toast;
}

/**
 * Fill form field by name
 */
export async function fillField(page: Page, fieldName: string, value: string) {
    const input = page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]`);
    await input.fill(value);
}

/**
 * Click button by text
 */
export async function clickButton(page: Page, buttonText: string) {
    const button = page.locator(`button:has-text("${buttonText}")`).first();
    await button.click();
}

/**
 * Check if element exists in DOM
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
    return await page.locator(selector).count() > 0;
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string) {
    return await page.waitForResponse(
        response => response.url().includes(urlPattern) && response.status() === 200,
        { timeout: TEST_TIMEOUTS.long }
    );
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

/**
 * Mock API endpoint
 */
export async function mockApiEndpoint(page: Page, urlPattern: string, responseData: any) {
    await page.route(urlPattern, route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(responseData),
        });
    });
}

/**
 * Generate random email for testing
 */
export function generateTestEmail(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `test.${timestamp}.${random}@voai.test`;
}

/**
 * Generate random phone number
 */
export function generateTestPhone(): string {
    const random = Math.floor(Math.random() * 100000000);
    return `+5511${random.toString().padStart(9, '0')}`;
}

/**
 * Wait for WebSocket connection
 */
export async function waitForWebSocketConnection(page: Page) {
    // Wait for socket.io connection
    await page.waitForFunction(() => {
        return (window as any).socket?.connected === true;
    }, { timeout: TEST_TIMEOUTS.long });
}

/**
 * Verify page accessibility (basic check)
 */
export async function checkAccessibility(page: Page) {
    // Check for basic accessibility attributes
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();

    // Check if page has a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
}
