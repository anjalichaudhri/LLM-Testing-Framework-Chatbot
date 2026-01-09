/**
 * Page Object Model for Healthcare Chatbot
 * Provides methods to interact with the chatbot UI
 */

class ChatbotPage {
  constructor(page) {
    this.page = page;
    this.selectors = {
      chatInput: 'input[type="text"], textarea, #message-input, [placeholder*="Ask about"]',
      sendButton: 'button[type="submit"], button:has-text("Send"), #send-button, button:has(svg)',
      chatMessages: '.message, .chat-message, [class*="message"]',
      botMessage: '.bot-message, .message.bot, [class*="bot"]',
      userMessage: '.user-message, .message.user, [class*="user"]',
      quickActionButton: '.quick-action-btn, button.quick-action, [class*="quick-action"]',
      typingIndicator: '.typing, .typing-indicator, [class*="typing"]',
      chatContainer: '.chat-container, .messages, #chat-messages, [class*="chat"]',
      exportButton: 'button:has-text("Export"), [aria-label*="Export"]',
      profileButton: 'button:has-text("Profile"), [aria-label*="Profile"]'
    };
  }

  /**
   * Navigate to chatbot
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for chatbot to be ready
   */
  async waitForReady() {
    await this.page.waitForSelector(this.selectors.chatInput, { state: 'visible' });
    // Wait a bit for initial message
    await this.page.waitForTimeout(1000);
  }

  /**
   * Send a message to the chatbot
   * @param {string} message - Message to send
   */
  async sendMessage(message) {
    const input = await this.page.locator(this.selectors.chatInput).first();
    await input.fill(message);
    await input.press('Enter');
    
    // Wait for message to be sent
    await this.page.waitForTimeout(500);
  }

  /**
   * Click send button (alternative to Enter)
   */
  async clickSend() {
    const sendButton = await this.page.locator(this.selectors.sendButton).first();
    await sendButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for bot response
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<string>} Bot response text
   */
  async waitForBotResponse(timeout = 30000) {
    // Wait for typing indicator to disappear (if present)
    try {
      await this.page.waitForSelector(this.selectors.typingIndicator, { 
        state: 'hidden', 
        timeout: 5000 
      });
    } catch (e) {
      // Typing indicator might not be present
    }

    // Wait for bot message to appear
    await this.page.waitForSelector(
      this.selectors.botMessage,
      { state: 'visible', timeout }
    );

    // Get the latest bot message
    const messages = await this.page.locator(this.selectors.botMessage).all();
    if (messages.length === 0) {
      throw new Error('No bot messages found');
    }

    const latestMessage = messages[messages.length - 1];
    return await latestMessage.textContent();
  }

  /**
   * Get all bot messages
   * @returns {Promise<Array<string>>} Array of bot messages
   */
  async getBotMessages() {
    const messages = await this.page.locator(this.selectors.botMessage).all();
    const texts = [];
    for (const msg of messages) {
      const text = await msg.textContent();
      if (text) texts.push(text.trim());
    }
    return texts;
  }

  /**
   * Get the latest bot message
   * @returns {Promise<string>} Latest bot message
   */
  async getLatestBotMessage() {
    const messages = await this.getBotMessages();
    return messages[messages.length - 1] || '';
  }

  /**
   * Get all user messages
   * @returns {Promise<Array<string>>} Array of user messages
   */
  async getUserMessages() {
    const messages = await this.page.locator(this.selectors.userMessage).all();
    const texts = [];
    for (const msg of messages) {
      const text = await msg.textContent();
      if (text) texts.push(text.trim());
    }
    return texts;
  }

  /**
   * Click a quick action button
   * @param {string} buttonText - Text of the button to click
   */
  async clickQuickAction(buttonText) {
    const button = this.page.locator(
      `${this.selectors.quickActionButton}:has-text("${buttonText}")`
    ).first();
    await button.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get all available quick action buttons
   * @returns {Promise<Array<string>>} Array of button texts
   */
  async getQuickActions() {
    const buttons = await this.page.locator(this.selectors.quickActionButton).all();
    const texts = [];
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text) texts.push(text.trim());
    }
    return texts;
  }

  /**
   * Check if quick action button exists
   * @param {string} buttonText - Button text to check
   * @returns {Promise<boolean>}
   */
  async hasQuickAction(buttonText) {
    const button = this.page.locator(
      `${this.selectors.quickActionButton}:has-text("${buttonText}")`
    ).first();
    return await button.isVisible().catch(() => false);
  }

  /**
   * Wait for quick actions to appear
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForQuickActions(timeout = 5000) {
    try {
      await this.page.waitForSelector(
        this.selectors.quickActionButton,
        { state: 'visible', timeout }
      );
    } catch (e) {
      // Quick actions might not always appear
    }
  }

  /**
   * Get conversation history
   * @returns {Promise<Array<object>>} Array of {role, message} objects
   */
  async getConversationHistory() {
    const userMessages = await this.getUserMessages();
    const botMessages = await this.getBotMessages();
    
    const history = [];
    const maxLength = Math.max(userMessages.length, botMessages.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < userMessages.length) {
        history.push({ role: 'user', message: userMessages[i] });
      }
      if (i < botMessages.length) {
        history.push({ role: 'bot', message: botMessages[i] });
      }
    }
    
    return history;
  }

  /**
   * Clear chat (if feature exists)
   */
  async clearChat() {
    // Try to find and click clear/reset button
    const clearButton = this.page.locator('button:has-text("Clear"), button:has-text("Reset")').first();
    if (await clearButton.isVisible().catch(() => false)) {
      await clearButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Take screenshot of chat
   * @param {string} name - Screenshot name
   */
  async screenshot(name) {
    const container = this.page.locator(this.selectors.chatContainer).first();
    if (await container.isVisible().catch(() => false)) {
      await container.screenshot({ path: `test-results/${name}.png` });
    } else {
      await this.page.screenshot({ path: `test-results/${name}.png` });
    }
  }

  /**
   * Measure response time
   * @param {string} message - Message to send
   * @returns {Promise<number>} Response time in milliseconds
   */
  async measureResponseTime(message) {
    const startTime = Date.now();
    await this.sendMessage(message);
    await this.waitForBotResponse();
    const endTime = Date.now();
    return endTime - startTime;
  }
}

module.exports = ChatbotPage;
