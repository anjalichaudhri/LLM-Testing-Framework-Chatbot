/**
 * UI/UX Interaction Tests
 * Tests user interface elements and interactions
 */

const { test, expect } = require('@playwright/test');
const ChatbotPage = require('../../src/playwright/chatbot-page');

test.describe('UI Interaction Tests', () => {
  let chatbotPage;

  test.beforeEach(async ({ page }) => {
    chatbotPage = new ChatbotPage(page);
    await chatbotPage.goto();
    await chatbotPage.waitForReady();
  });

  test('should display chat input field', async () => {
    const input = chatbotPage.page.locator(chatbotPage.selectors.chatInput).first();
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test('should send message when Enter is pressed', async () => {
    await chatbotPage.sendMessage('Hello');
    await chatbotPage.waitForBotResponse();
    
    const botResponse = await chatbotPage.getLatestBotMessage();
    expect(botResponse).toBeTruthy();
    expect(botResponse.length).toBeGreaterThan(0);
  });

  test('should send message when send button is clicked', async () => {
    const input = chatbotPage.page.locator(chatbotPage.selectors.chatInput).first();
    await input.fill('Test message');
    await chatbotPage.clickSend();
    
    await chatbotPage.waitForBotResponse();
    const botResponse = await chatbotPage.getLatestBotMessage();
    expect(botResponse).toBeTruthy();
  });

  test('should display quick action buttons after bot response', async () => {
    await chatbotPage.sendMessage('I have symptoms');
    await chatbotPage.waitForBotResponse();
    await chatbotPage.waitForQuickActions();

    const quickActions = await chatbotPage.getQuickActions();
    expect(quickActions.length).toBeGreaterThan(0);
  });

  test('should click quick action button and get response', async () => {
    await chatbotPage.sendMessage('Hello');
    await chatbotPage.waitForBotResponse();
    await chatbotPage.waitForQuickActions();

    const quickActions = await chatbotPage.getQuickActions();
    if (quickActions.length > 0) {
      const firstAction = quickActions[0];
      await chatbotPage.clickQuickAction(firstAction);
      await chatbotPage.waitForBotResponse();
      
      const response = await chatbotPage.getLatestBotMessage();
      expect(response).toBeTruthy();
    }
  });

  test('should maintain conversation history', async () => {
    await chatbotPage.sendMessage('First message');
    await chatbotPage.waitForBotResponse();
    
    await chatbotPage.sendMessage('Second message');
    await chatbotPage.waitForBotResponse();

    const history = await chatbotPage.getConversationHistory();
    expect(history.length).toBeGreaterThanOrEqual(4); // 2 user + 2 bot messages
  });

  test('should handle multiple rapid messages', async () => {
    const messages = ['Message 1', 'Message 2', 'Message 3'];
    
    for (const msg of messages) {
      await chatbotPage.sendMessage(msg);
      await chatbotPage.page.waitForTimeout(500); // Small delay
    }

    // Wait for all responses
    await chatbotPage.page.waitForTimeout(5000);
    
    const botMessages = await chatbotPage.getBotMessages();
    expect(botMessages.length).toBeGreaterThanOrEqual(1);
  });

  test('should display user and bot messages correctly', async () => {
    await chatbotPage.sendMessage('Test message');
    await chatbotPage.waitForBotResponse();

    const userMessages = await chatbotPage.getUserMessages();
    const botMessages = await chatbotPage.getBotMessages();

    expect(userMessages.length).toBeGreaterThan(0);
    expect(botMessages.length).toBeGreaterThan(0);
    expect(userMessages[userMessages.length - 1]).toContain('Test message');
  });

  test('should handle empty input gracefully', async () => {
    const input = chatbotPage.page.locator(chatbotPage.selectors.chatInput).first();
    await input.fill('');
    await input.press('Enter');
    
    // Should not crash, may or may not send message
    await chatbotPage.page.waitForTimeout(1000);
    
    // Chat should still be functional
    await chatbotPage.sendMessage('Test after empty');
    await chatbotPage.waitForBotResponse();
    const response = await chatbotPage.getLatestBotMessage();
    expect(response).toBeTruthy();
  });

  test('should handle long messages', async () => {
    const longMessage = 'A'.repeat(500);
    await chatbotPage.sendMessage(longMessage);
    
    // Should handle without crashing
    await chatbotPage.page.waitForTimeout(3000);
    
    // Chat should still work
    await chatbotPage.sendMessage('Follow up');
    await chatbotPage.waitForBotResponse();
  });
});
