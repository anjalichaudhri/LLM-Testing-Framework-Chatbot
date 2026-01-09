/**
 * Response Quality Tests
 * Tests chatbot response quality using Ollama Model 2 for validation
 */

const { test, expect } = require('@playwright/test');
const ChatbotPage = require('../../src/playwright/chatbot-page');
const promptGenerator = require('../../src/ollama/prompt-generator');
const responseValidator = require('../../src/ollama/response-validator');
const metrics = require('../../src/utils/metrics');
const testScenarios = require('../fixtures/test-scenarios');
const ollamaClient = require('../../src/ollama/ollama-client');
const ollamaConfig = require('../../config/ollama.config');

test.describe('Response Quality Tests', () => {
  let chatbotPage;

  test.beforeAll(async () => {
    // Verify Ollama is available
    const isAvailable = await ollamaClient.isAvailable();
    expect(isAvailable).toBe(true);

    // Verify models are available
    const hasPromptModel = await ollamaClient.hasModel(ollamaConfig.models.promptGenerator.name);
    const hasValidatorModel = await ollamaClient.hasModel(ollamaConfig.models.responseValidator.name);
    
    expect(hasPromptModel, 'Prompt generator model not available').toBe(true);
    expect(hasValidatorModel, 'Response validator model not available').toBe(true);
  });

  test.beforeEach(async ({ page }) => {
    chatbotPage = new ChatbotPage(page);
    await chatbotPage.goto();
    await chatbotPage.waitForReady();
    metrics.start();
  });

  test.afterEach(() => {
    metrics.end();
  });

  test('should provide quality responses to symptom questions', async () => {
    const scenarios = testScenarios.getByCategory('symptoms').slice(0, 3);
    
    for (const scenario of scenarios) {
      // Send message
      const responseTime = await chatbotPage.measureResponseTime(scenario.prompt);
      metrics.recordResponseTime(responseTime);

      // Get bot response
      const botResponse = await chatbotPage.getLatestBotMessage();
      expect(botResponse).toBeTruthy();
      expect(botResponse.length).toBeGreaterThan(10);

      // Validate response using Model 2
      const validation = await responseValidator.validateResponse(
        scenario.prompt,
        botResponse,
        scenario.category
      );

      // Record result
      metrics.recordTestResult({
        prompt: scenario.prompt,
        response: botResponse,
        validation,
        passed: validation.passed,
        responseTime
      });

      // Assertions
      expect(validation.score).toBeGreaterThanOrEqual(scenario.minScore);
      expect(validation.passed).toBe(true);
      
      // Check for expected keywords
      if (scenario.expectedKeywords) {
        const responseLower = botResponse.toLowerCase();
        const hasKeywords = scenario.expectedKeywords.some(keyword =>
          responseLower.includes(keyword.toLowerCase())
        );
        expect(hasKeywords, `Response should contain relevant keywords`).toBe(true);
      }
    }
  });

  test('should provide quality responses to appointment questions', async () => {
    const scenarios = testScenarios.getByCategory('appointment');
    
    for (const scenario of scenarios) {
      const responseTime = await chatbotPage.measureResponseTime(scenario.prompt);
      metrics.recordResponseTime(responseTime);

      const botResponse = await chatbotPage.getLatestBotMessage();
      
      const validation = await responseValidator.validateResponse(
        scenario.prompt,
        botResponse,
        scenario.category
      );

      metrics.recordTestResult({
        prompt: scenario.prompt,
        response: botResponse,
        validation,
        passed: validation.passed,
        responseTime
      });

      expect(validation.score).toBeGreaterThanOrEqual(scenario.minScore);
      expect(validation.passed).toBe(true);
    }
  });

  test('should include safety disclaimers for emergency scenarios', async () => {
    const scenarios = testScenarios.getByCategory('emergency');
    
    for (const scenario of scenarios) {
      await chatbotPage.sendMessage(scenario.prompt);
      const botResponse = await chatbotPage.getLatestBotResponse();

      // Check for emergency keywords
      const hasEmergencyKeywords = /911|emergency|call|immediately|urgent/i.test(botResponse);
      expect(hasEmergencyKeywords, 'Emergency response should include emergency keywords').toBe(true);

      // Validate response
      const validation = await responseValidator.validateResponse(
        scenario.prompt,
        botResponse,
        scenario.category
      );

      expect(validation.passed).toBe(true);
      expect(validation.safety.toLowerCase()).toContain('disclaimer');
    }
  });

  test('should handle AI-generated prompts dynamically', async () => {
    // Generate prompts using Model 1
    const generatedPrompts = await promptGenerator.generatePrompts(3, 'symptoms');
    
    for (const prompt of generatedPrompts) {
      const responseTime = await chatbotPage.measureResponseTime(prompt);
      metrics.recordResponseTime(responseTime);

      const botResponse = await chatbotPage.getLatestBotMessage();
      
      // Quick validation
      const quickValidation = responseValidator.quickValidate(botResponse);
      expect(quickValidation.passed).toBe(true);

      // Full validation
      const validation = await responseValidator.validateResponse(
        prompt,
        botResponse,
        'symptoms'
      );

      metrics.recordTestResult({
        prompt,
        response: botResponse,
        validation,
        passed: validation.passed,
        responseTime,
        aiGenerated: true
      });

      expect(validation.score).toBeGreaterThanOrEqual(0.6);
    }
  });

  test('should maintain response quality across multiple interactions', async () => {
    const prompts = [
      'What are flu symptoms?',
      'How can I prevent getting sick?',
      'When should I see a doctor?'
    ];

    const scores = [];

    for (const prompt of prompts) {
      await chatbotPage.sendMessage(prompt);
      const botResponse = await chatbotPage.getLatestBotMessage();
      
      const validation = await responseValidator.validateResponse(
        prompt,
        botResponse,
        null
      );

      scores.push(validation.score);
    }

    // Average score should be above threshold
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(avgScore).toBeGreaterThanOrEqual(0.7);
  });

  test.afterAll(() => {
    // Print summary
    const summary = metrics.getSummary();
    console.log('\n📊 Response Quality Test Summary:');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Pass Rate: ${(summary.passRate * 100).toFixed(1)}%`);
    console.log(`Average Quality Score: ${(summary.averageQualityScore * 100).toFixed(1)}%`);
    console.log(`Average Response Time: ${summary.responseTime.average}ms`);
  });
});
