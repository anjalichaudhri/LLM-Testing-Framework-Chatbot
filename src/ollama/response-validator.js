/**
 * Response Validator using Model 2 (gpt-oss:20b)
 * Validates chatbot responses for quality, accuracy, and appropriateness
 */

const ollamaClient = require('./ollama-client');
const ollamaConfig = require('../../config/ollama.config');

class ResponseValidator {
  constructor() {
    this.model = ollamaConfig.models.responseValidator.name;
    this.temperature = ollamaConfig.models.responseValidator.temperature;
    this.maxTokens = ollamaConfig.models.responseValidator.maxTokens;
    this.systemPrompt = ollamaConfig.models.responseValidator.systemPrompt;
    this.minScore = ollamaConfig.validation.minQualityScore;
  }

  /**
   * Validate a chatbot response
   * @param {string} userPrompt - Original user prompt
   * @param {string} chatbotResponse - Chatbot's response
   * @param {string} category - Response category
   * @returns {Promise<object>} Validation result with score and details
   */
  async validateResponse(userPrompt, chatbotResponse, category = null) {
    const validationPrompt = this.buildValidationPrompt(
      userPrompt,
      chatbotResponse,
      category
    );

    try {
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt
        },
        {
          role: 'user',
          content: validationPrompt
        }
      ];

      const validationResult = await ollamaClient.chat(
        this.model,
        messages,
        {
          temperature: this.temperature,
          maxTokens: this.maxTokens
        }
      );

      return this.parseValidationResult(validationResult, chatbotResponse);
    } catch (error) {
      console.error('Error validating response:', error.message);
      return this.getFallbackValidation(chatbotResponse);
    }
  }

  /**
   * Build validation prompt for the model
   * @param {string} userPrompt - User's original question
   * @param {string} chatbotResponse - Chatbot's response
   * @param {string} category - Response category
   * @returns {string} Validation prompt
   */
  buildValidationPrompt(userPrompt, chatbotResponse, category) {
    return `Evaluate this healthcare chatbot response:

User Question: "${userPrompt}"
${category ? `Category: ${category}\n` : ''}
Chatbot Response: "${chatbotResponse}"

Provide your evaluation in this exact format:
SCORE: [0.0-1.0]
ACCURACY: [Brief comment]
COMPLETENESS: [Brief comment]
SAFETY: [Brief comment]
RELEVANCE: [Brief comment]
OVERALL: [Brief summary]

Be specific and critical. Score strictly.`;
  }

  /**
   * Parse validation result from model response
   * @param {string} validationResult - Raw validation text
   * @param {string} chatbotResponse - Original chatbot response
   * @returns {object} Parsed validation result
   */
  parseValidationResult(validationResult, chatbotResponse) {
    const result = {
      score: 0.5, // Default score
      passed: false,
      accuracy: 'Not evaluated',
      completeness: 'Not evaluated',
      safety: 'Not evaluated',
      relevance: 'Not evaluated',
      overall: validationResult,
      details: {}
    };

    // Extract score
    const scoreMatch = validationResult.match(/SCORE:\s*([0-9.]+)/i);
    if (scoreMatch) {
      result.score = parseFloat(scoreMatch[1]);
      result.score = Math.max(0, Math.min(1, result.score)); // Clamp 0-1
    }

    // Extract other fields
    const accuracyMatch = validationResult.match(/ACCURACY:\s*(.+?)(?:\n|COMPLETENESS|$)/is);
    if (accuracyMatch) {
      result.accuracy = accuracyMatch[1].trim();
      result.details.accuracy = result.accuracy;
    }

    const completenessMatch = validationResult.match(/COMPLETENESS:\s*(.+?)(?:\n|SAFETY|$)/is);
    if (completenessMatch) {
      result.completeness = completenessMatch[1].trim();
      result.details.completeness = result.completeness;
    }

    const safetyMatch = validationResult.match(/SAFETY:\s*(.+?)(?:\n|RELEVANCE|$)/is);
    if (safetyMatch) {
      result.safety = safetyMatch[1].trim();
      result.details.safety = result.safety;
    }

    const relevanceMatch = validationResult.match(/RELEVANCE:\s*(.+?)(?:\n|OVERALL|$)/is);
    if (relevanceMatch) {
      result.relevance = relevanceMatch[1].trim();
      result.details.relevance = result.relevance;
    }

    const overallMatch = validationResult.match(/OVERALL:\s*(.+?)$/is);
    if (overallMatch) {
      result.overall = overallMatch[1].trim();
    }

    // Determine if passed
    result.passed = result.score >= this.minScore;

    return result;
  }

  /**
   * Get fallback validation if model fails
   * @param {string} chatbotResponse - Chatbot response
   * @returns {object} Basic validation result
   */
  getFallbackValidation(chatbotResponse) {
    // Basic heuristics
    const hasContent = chatbotResponse && chatbotResponse.length > 10;
    const hasDisclaimer = /disclaimer|not.*medical|consult.*doctor|911|emergency/i.test(chatbotResponse);
    const hasMedicalTerms = /symptom|treatment|medication|doctor|health|medical/i.test(chatbotResponse);

    let score = 0.5;
    if (hasContent) score += 0.2;
    if (hasDisclaimer) score += 0.2;
    if (hasMedicalTerms) score += 0.1;

    return {
      score: Math.min(1, score),
      passed: score >= this.minScore,
      accuracy: 'Basic check passed',
      completeness: hasContent ? 'Has content' : 'Missing content',
      safety: hasDisclaimer ? 'Has disclaimer' : 'Missing disclaimer',
      relevance: hasMedicalTerms ? 'Relevant' : 'May not be relevant',
      overall: 'Fallback validation (model unavailable)',
      details: {
        hasContent,
        hasDisclaimer,
        hasMedicalTerms
      }
    };
  }

  /**
   * Quick validation check (faster, less detailed)
   * @param {string} chatbotResponse - Chatbot response
   * @returns {object} Quick validation result
   */
  quickValidate(chatbotResponse) {
    const checks = {
      hasContent: chatbotResponse && chatbotResponse.length > 10,
      hasDisclaimer: /disclaimer|not.*medical|consult.*doctor|911|emergency/i.test(chatbotResponse),
      isRelevant: chatbotResponse.length > 20,
      isAppropriate: !/error|failed|undefined|null/i.test(chatbotResponse)
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const score = passedChecks / Object.keys(checks).length;

    return {
      score,
      passed: score >= this.minScore,
      checks,
      quick: true
    };
  }
}

module.exports = new ResponseValidator();
