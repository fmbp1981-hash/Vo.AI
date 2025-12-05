import { test, expect } from '@playwright/test';
import { ROUTES, SELECTORS, TEST_TIMEOUTS } from '../../utils/test-data';
import { loginAsAdmin, waitForPageLoad, checkAccessibility } from '../../utils/test-helpers';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto(ROUTES.dashboard);
        await waitForPageLoad(page);
    });

    test('should load dashboard successfully', async ({ page }) => {
        // Verify we're on the dashboard
        expect(page.url()).not.toContain('/auth/login');

        // Verify dashboard title or heading exists
        const heading = page.locator(SELECTORS.dashboardTitle).first();
        await expect(heading).toBeVisible();
    });

    test('should display key metrics', async ({ page }) => {
        // Look for metric cards
        const metricCards = page.locator('[data-testid="metric-card"], .metric-card, [class*="metric"]');

        // Should have at least one metric
        const count = await metricCards.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should navigate to CRM section', async ({ page }) => {
        // Find and click CRM link
        const crmLink = page.locator('a[href*="/crm"], nav a:has-text("CRM")').first();

        if (await crmLink.isVisible()) {
            await crmLink.click();
            await page.waitForURL('**/crm', { timeout: TEST_TIMEOUTS.navigation });

            expect(page.url()).toContain('/crm');
        }
    });

    test('should navigate to Chat section', async ({ page }) => {
        // Find and click Chat link
        const chatLink = page.locator('a[href*="/chat"], nav a:has-text("Chat"), nav a:has-text("Conversas")').first();

        if (await chatLink.isVisible()) {
            await chatLink.click();
            await page.waitForURL('**/chat', { timeout: TEST_TIMEOUTS.navigation });

            expect(page.url()).toContain('/chat');
        }
    });

    test('should display user information', async ({ page }) => {
        // Look for user menu or profile display
        const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Perfil"), [class*="user"]').first();

        // Some user indicator should be visible
        const userElements = await page.locator('text=/admin|user|perfil/i').count();
        expect(userElements).toBeGreaterThan(0);
    });

    test('should have working navigation menu', async ({ page }) => {
        // Verify main navigation exists
        const nav = page.locator('nav, [role="navigation"], aside').first();
        await expect(nav).toBeVisible();

        // Should have multiple navigation links
        const navLinks = page.locator('nav a, aside a');
        const linkCount = await navLinks.count();
        expect(linkCount).toBeGreaterThan(1);
    });

    test('should display recent activity or updates', async ({ page }) => {
        // Look for activity feed, recent items, or notifications
        const activitySection = page.locator(
            '[data-testid="activity"], [data-testid="recent"], .activity, .recent-activity, [class*="timeline"]'
        ).first();

        // If activity section exists, it should be visible
        const exists = await activitySection.count() > 0;
        if (exists) {
            await expect(activitySection).toBeVisible();
        }
    });

    test('should be responsive on mobile viewport', async ({ page }) => {
        // Change to mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.reload();
        await waitForPageLoad(page);

        // Page should still be accessible
        const heading = page.locator(SELECTORS.dashboardTitle).first();
        await expect(heading).toBeVisible();

        // Navigation might be in a hamburger menu on mobile
        const hamburger = page.locator('button[aria-label*="menu"], button:has(svg:has-text("menu"))').first();
        const exists = await hamburger.count() > 0;

        if (exists) {
            await expect(hamburger).toBeVisible();
        }
    });

    test('should pass basic accessibility checks', async ({ page }) => {
        await checkAccessibility(page);
    });
});
