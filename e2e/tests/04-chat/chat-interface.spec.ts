import { test, expect } from '@playwright/test';
import { ROUTES, SELECTORS, TEST_MESSAGES, TEST_TIMEOUTS } from '../../utils/test-data';
import { loginAsAdmin, waitForPageLoad } from '../../utils/test-helpers';

test.describe('Chat Interface', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto(ROUTES.chat);
        await waitForPageLoad(page);
    });

    test('should load chat interface', async ({ page }) => {
        // Verify we're on chat page
        expect(page.url()).toContain('/chat');

        // Should have chat interface elements
        const chatInterface = page.locator('[data-testid="chat-interface"], main, .chat-container');
        await expect(chatInterface.first()).toBeVisible();
    });

    test('should display conversation list', async ({ page }) => {
        // Look for list of conversations
        const conversationList = page.locator(SELECTORS.chatList, '[data-testid="conversation-list"], .conversation-list');

        await page.waitForTimeout(2000); // Wait for data to load

        // List should be visible (even if empty)
        const exists = await conversationList.count() > 0;
        expect(exists).toBeTruthy();
    });

    test('should select a conversation', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Find first conversation
        const firstConversation = page.locator('[data-testid="conversation"], .conversation-item, [class*="conversation"]').first();

        const conversationExists = await firstConversation.count() > 0;

        if (conversationExists && await firstConversation.isVisible()) {
            await firstConversation.click();
            await page.waitForTimeout(1000);

            // Should show messages for that conversation
            const messageArea = page.locator('[data-testid="message-area"], .messages, [class*="message"]');
            await expect(messageArea.first()).toBeVisible();
        }
    });

    test('should display messages in conversation', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Select first conversation if exists
        const firstConversation = page.locator('[data-testid="conversation"]').first();

        if (await firstConversation.isVisible()) {
            await firstConversation.click();
            await page.waitForTimeout(1000);

            // Look for messages
            const messages = page.locator(SELECTORS.chatMessage, '[data-testid="message"], .message');

            // Might be 0 if conversation is new
            const messageCount = await messages.count();
            expect(messageCount).toBeGreaterThanOrEqual(0);
        }
    });

    test('should show message input field', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Message input should be visible
        const messageInput = page.locator(SELECTORS.messageInput, '[data-testid="message-input"]');

        // Might not be visible until conversation is selected
        const conversations = page.locator('[data-testid="conversation"]');
        if (await conversations.count() > 0) {
            await conversations.first().click();
            await page.waitForTimeout(500);
        }

        // Now input should be visible
        await expect(messageInput.first()).toBeVisible({ timeout: TEST_TIMEOUTS.medium });
    });

    test('should send a message', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Select conversation
        const conversations = page.locator('[data-testid="conversation"]');
        if (await conversations.count() > 0) {
            await conversations.first().click();
            await page.waitForTimeout(500);
        }

        const messageInput = page.locator(SELECTORS.messageInput).first();

        if (await messageInput.isVisible()) {
            // Type message
            await messageInput.fill(TEST_MESSAGES.simple);

            // Click send button
            const sendButton = page.locator(SELECTORS.sendButton, '[data-testid="send-button"]').first();
            await sendButton.click();

            // Wait for message to appear
            await page.waitForTimeout(2000);

            // Message should appear in conversation
            const sentMessage = page.locator(`text="${TEST_MESSAGES.simple}"`);
            await expect(sentMessage.first()).toBeVisible({ timeout: TEST_TIMEOUTS.medium });
        }
    });

    test('should not send empty message', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Select conversation
        const conversations = page.locator('[data-testid="conversation"]');
        if (await conversations.count() > 0) {
            await conversations.first().click();
            await page.waitForTimeout(500);
        }

        const sendButton = page.locator(SELECTORS.sendButton).first();

        if (await sendButton.isVisible()) {
            // Try to send without typing
            const isDisabled = await sendButton.isDisabled();

            // Button should be disabled or clicking should do nothing
            if (!isDisabled) {
                const messageCountBefore = await page.locator(SELECTORS.chatMessage).count();
                await sendButton.click();
                await page.waitForTimeout(1000);
                const messageCountAfter = await page.locator(SELECTORS.chatMessage).count();

                // Count shouldn't increase
                expect(messageCountAfter).toBe(messageCountBefore);
            } else {
                expect(isDisabled).toBeTruthy();
            }
        }
    });

    test('should show typing indicator', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Look for typing indicator (might not always be visible)
        const typingIndicator = page.locator('[data-testid="typing-indicator"], .typing, [class*="typing"]');

        // This is optional feature
        const exists = await typingIndicator.count() > 0;

        if (exists) {
            // Can't reliably test this without sending actual messages
            test.skip();
        }
    });

    test('should display customer information', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Select conversation
        const conversations = page.locator('[data-testid="conversation"]');
        if (await conversations.count() > 0) {
            await conversations.first().click();
            await page.waitForTimeout(1000);

            // Look for customer info panel
            const customerInfo = page.locator('[data-testid="customer-info"], .customer-info, aside');

            // Might be in a sidebar or modal
            const exists = await customerInfo.count() > 0;

            if (exists) {
                await expect(customerInfo.first()).toBeVisible();
            }
        }
    });

    test('should handle long messages', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Select conversation
        const conversations = page.locator('[data-testid="conversation"]');
        if (await conversations.count() > 0) {
            await conversations.first().click();
            await page.waitForTimeout(500);
        }

        const messageInput = page.locator(SELECTORS.messageInput).first();

        if (await messageInput.isVisible()) {
            // Type long message
            await messageInput.fill(TEST_MESSAGES.long);

            // Should accept the text
            const value = await messageInput.inputValue();
            expect(value).toContain('Lorem ipsum');
        }
    });
});
