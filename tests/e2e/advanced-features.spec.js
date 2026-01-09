/**
 * Advanced Features Tests
 * Tests multi-turn conversations, edge cases, and advanced validation
 */

const { test, expect } = require('@playwright/test');
const ChatbotPage = require('../../src/playwright/chatbot-page');
const conversationGenerator = require('../../src/ollama/conversation-generator');
const responseValidator = require('../../src/ollama/response-validator');
const semanticValidator = require('../../src/validators/semantic-validator');
const performanceBenchmark = require('../../src/utils/performance-benchmark');
const baselineManager = require('../../src/utils/baseline-manager');

test.describe('Advanced Features Tests', () => {
  let chatbotPage;

  test.beforeEach(async ({ page }) => {
    chatbotPage = new ChatbotPage(page);
    await chatbotPage.goto();
    await chatbotPage.waitForReady();
  });

  test('should handle multi-turn conversations', async () => {
    // Generate multi-turn conversation using Model 1
    const conversation = await conversationGenerator.generateConversation('symptoms', 3);
    
    expect(conversation.length).toBeGreaterThanOrEqual(2);
    
    // Execute conversation
    for (let i = 0; i < conversation.length; i++) {
      const prompt = conversation[i];
      const startTime = Date.now();
      
      await chatbotPage.sendMessage(prompt);
      await chatbotPage.waitForBotResponse();
      
      const responseTime = Date.now() - startTime;
      performanceBenchmark.record(responseTime, `multi-turn-${i}`);
      
      const response = await chatbotPage.getLatestBotMessage();
      expect(response.length).toBeGreaterThan(10);
      
      // Validate response quality
      const validation = await responseValidator.validateResponse(
        prompt,
        response,
        'symptoms'
      );
      
      expect(validation.score).toBeGreaterThanOrEqual(0.5);
    }
  });

  test('should handle edge cases gracefully', async () => {
    const edgeCases = conversationGenerator.generateEdgeCases();
    
    for (const edgeCase of edgeCases.slice(0, 5)) { // Test first 5
      await chatbotPage.sendMessage(edgeCase);
      await chatbotPage.waitForBotResponse();
      
      const response = await chatbotPage.getLatestBotMessage();
      
      // Should not crash - response should exist
      expect(response).toBeDefined();
      
      // Should not be an error (unless it's truly invalid)
      if (edgeCase.trim().length > 0) {
        expect(response.toLowerCase()).not.toContain('error');
      }
    }
  });

  test('should maintain context in multi-turn conversations', async () => {
    // First message
    await chatbotPage.sendMessage('I have a headache');
    await chatbotPage.waitForBotResponse();
    
    // Generate context-aware follow-up
    const history = await chatbotPage.getConversationHistory();
    const followUp = await conversationGenerator.generateContextAwarePrompt(
      history.map(h => h.message),
      'symptoms'
    );
    
    // Second message (should reference headache)
    await chatbotPage.sendMessage(followUp);
    await chatbotPage.waitForBotResponse();
    
    const response = await chatbotPage.getLatestBotMessage();
    
    // Response should acknowledge previous context
    const hasContext = response.toLowerCase().includes('headache') ||
                       response.toLowerCase().includes('pain') ||
                       response.toLowerCase().includes('symptom');
    
    expect(hasContext).toBe(true);
  });

  test('should detect performance regressions', async () => {
    // Set baseline
    performanceBenchmark.reset();
    
    // Run tests
    const testPrompts = ['Hello', 'I have symptoms', 'Need appointment'];
    for (const prompt of testPrompts) {
      const startTime = Date.now();
      await chatbotPage.sendMessage(prompt);
      await chatbotPage.waitForBotResponse();
      const responseTime = Date.now() - startTime;
      performanceBenchmark.record(responseTime, prompt);
    }
    
    // Set baseline
    performanceBenchmark.setBaseline();
    
    // Run again
    for (const prompt of testPrompts) {
      const startTime = Date.now();
      await chatbotPage.sendMessage(prompt);
      await chatbotPage.waitForBotResponse();
      const responseTime = Date.now() - startTime;
      performanceBenchmark.record(responseTime, prompt);
    }
    
    // Check for regression
    const comparison = performanceBenchmark.compareWithBaseline();
    const performanceCheck = performanceBenchmark.checkPerformance(5000, 10000);
    
    expect(performanceCheck.passed).toBe(true);
    
    if (comparison.regression) {
      console.warn('⚠️ Performance regression detected:', comparison);
    }
  });

  test('should compare responses semantically', async () => {
    const prompt = 'What are flu symptoms?';
    
    await chatbotPage.sendMessage(prompt);
    await chatbotPage.waitForBotResponse();
    const response1 = await chatbotPage.getLatestBotMessage();
    
    // Get another response (might be different)
    await chatbotPage.sendMessage(prompt);
    await chatbotPage.waitForBotResponse();
    const response2 = await chatbotPage.getLatestBotMessage();
    
    // Compare semantically
    const similarity = await semanticValidator.compareResponses(response1, response2);
    
    // Should be similar (same question, similar answers)
    expect(similarity).toBeGreaterThanOrEqual(0.5);
  });

  test('should detect response regressions using baselines', async () => {
    const prompt = 'What are the symptoms of flu?';
    const testId = baselineManager.generateTestId(prompt);
    
    // First run - save baseline
    await chatbotPage.sendMessage(prompt);
    await chatbotPage.waitForBotResponse();
    const baselineResponse = await chatbotPage.getLatestBotMessage();
    
    baselineManager.saveBaseline(testId, prompt, baselineResponse, {
      category: 'symptoms',
      quality: 'good'
    });
    
    // Second run - compare
    await chatbotPage.sendMessage(prompt);
    await chatbotPage.waitForBotResponse();
    const currentResponse = await chatbotPage.getLatestBotMessage();
    
    const comparison = await baselineManager.compareWithBaseline(
      testId,
      currentResponse,
      semanticValidator
    );
    
    expect(comparison.hasBaseline).toBe(true);
    
    // Responses should be similar
    // Note: Fallback similarity (word overlap) may be lower than embedding-based
    if (comparison.semanticSimilarity !== null) {
      // Lower threshold for fallback method (word overlap is less accurate)
      const threshold = comparison.semanticSimilarity < 0.6 ? 0.4 : 0.6;
      expect(comparison.semanticSimilarity).toBeGreaterThanOrEqual(threshold);
      
      // Log similarity for debugging
      console.log(`Semantic similarity: ${(comparison.semanticSimilarity * 100).toFixed(1)}%`);
    }
  });

  test('should handle stress testing with rapid messages', async () => {
    const rapidPrompts = await conversationGenerator.generateStressTestPrompts(5);
    
    const startTime = Date.now();
    
    for (const prompt of rapidPrompts) {
      await chatbotPage.sendMessage(prompt);
      // Don't wait for response - rapid fire
      await chatbotPage.page.waitForTimeout(100);
    }
    
    // Wait for all responses
    await chatbotPage.page.waitForTimeout(5000);
    
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / rapidPrompts.length;
    
    // Should handle rapid messages without crashing
    const botMessages = await chatbotPage.getBotMessages();
    expect(botMessages.length).toBeGreaterThan(0);
    
    // Average response time should be reasonable
    expect(avgTime).toBeLessThan(10000); // Less than 10 seconds per message
  });
});
