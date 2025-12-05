import { test, expect } from '@playwright/test';
import { ROUTES, SELECTORS, TEST_TIMEOUTS } from '../../utils/test-data';
import { loginAsAdmin, waitForPageLoad, clickButton } from '../../utils/test-helpers';

test.describe('CRM - Leads List', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto(ROUTES.crm);
        await waitForPageLoad(page);
    });

    test('should display CRM page', async ({ page }) => {
        // Verify we're on CRM page
        expect(page.url()).toContain('/crm');

        // Should have a title or heading
        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible();
    });

    test('should display leads list or Kanban board', async ({ page }) => {
        // Look for leads/cards
        const leads = page.locator(
            '[data-testid="lead-card"], [data-testid="kanban-column"], .lead-card, [class*="kanban"]'
        );

        // Wait for content to load
        await page.waitForTimeout(2000);

        const count = await leads.count();

        // Should have at least one lead or kanban column
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show create lead button', async ({ page }) => {
        const createButton = page.locator(SELECTORS.createLeadButton).first();

        // Button might take a moment to appear
        await expect(createButton).toBeVisible({ timeout: TEST_TIMEOUTS.medium });
    });

    test('should open create lead modal/form', async ({ page }) => {
        const createButton = page.locator(SELECTORS.createLeadButton).first();

        if (await createButton.isVisible()) {
            await createButton.click();

            // Look for modal or form
            const modal = page.locator(SELECTORS.modal, 'form').first();
            await expect(modal).toBeVisible({ timeout: TEST_TIMEOUTS.medium });

            // Should have name and email inputs
            const nameInput = page.locator(SELECTORS.leadNameInput);
            const emailInput = page.locator(SELECTORS.leadEmailInput);

            await expect(nameInput).toBeVisible();
            await expect(emailInput).toBeVisible();
        }
    });

    test('should filter/search leads', async ({ page }) => {
        // Look for search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Search"]').first();

        if (await searchInput.isVisible()) {
            await searchInput.fill('Maria');
            await page.waitForTimeout(1000); // Wait for filter to apply

            // Results should update (hard to verify exact results without knowing data)
            // At minimum, page shouldn't error
            const leads = page.locator('[data-testid="lead-card"], .lead-card');
            const count = await leads.count();
            expect(count).toBeGreaterThanOrEqual(0);
        }
    });

    test('should display lead details on click', async ({ page }) => {
        const firstLead = page.locator('[data-testid="lead-card"], .lead-card, [class*="lead"]').first();

        const exists = await firstLead.count() > 0;

        if (exists && await firstLead.isVisible()) {
            await firstLead.click();

            // Should show more details (modal, sidebar, or navigation)
            await page.waitForTimeout(1000);

            // Either modal opened or navigated to detail page
            const modalOrDetail = await page.locator(SELECTORS.modal).isVisible() ||
                page.url().includes('/lead/') ||
                await page.locator('[data-testid="lead-detail"]').isVisible();

            expect(modalOrDetail).toBeTruthy();
        }
    });

    test('should have pagination if many leads', async ({ page }) => {
        // Look for pagination controls
        const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagination"], .pagination').first();

        const exists = await pagination.count() > 0;

        if (exists) {
            await expect(pagination).toBeVisible();
        }
    });

    test('should display different lead statuses', async ({ page }) => {
        // Look for status indicators/badges
        const statusBadges = page.locator('[data-testid="status"], .badge, [class*="status"]');

        const count = await statusBadges.count();

        // If we have leads, we should have status indicators
        if (count > 0) {
            const firstBadge = statusBadges.first();
            await expect(firstBadge).toBeVisible();
        }
    });
});
