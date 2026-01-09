/**
 * Hallucination Detector
 * Detects when chatbot generates false or unsupported medical information
 * Critical for healthcare safety
 */

const ollamaClient = require('../ollama/ollama-client');
const ollamaConfig = require('../../config/ollama.config');

class HallucinationDetector {
  constructor() {
    this.model = ollamaConfig.models.responseValidator.name; // Use Model 2 for validation
    this.temperature = 0.2; // Lower temperature for more deterministic fact-checking
  }

  /**
   * Detect hallucinations in chatbot response
   * @param {string} userPrompt - User's question
   * @param {string} chatbotResponse - Chatbot's response
   * @param {string} category - Response category (symptoms, medication, etc.)
   * @returns {Promise<object>} Hallucination detection result
   */
  async detectHallucination(userPrompt, chatbotResponse, category = null) {
    const detectionPrompt = this.buildDetectionPrompt(
      userPrompt,
      chatbotResponse,
      category
    );

    try {
      const messages = [
        {
          role: 'system',
          content: `You are a medical fact-checker. Your job is to identify:
1. False medical claims
2. Unsupported medical advice
3. Made-up symptoms or conditions
4. Incorrect medication information
5. Dangerous medical recommendations
6. Information not backed by medical knowledge

Be strict and critical. Healthcare safety is paramount.`
        },
        {
          role: 'user',
          content: detectionPrompt
        }
      ];

      const result = await ollamaClient.chat(
        this.model,
        messages,
        {
          temperature: this.temperature,
          maxTokens: 500
        }
      );

      return this.parseDetectionResult(result, chatbotResponse);
    } catch (error) {
      console.error('Error detecting hallucination:', error.message);
      return this.getFallbackDetection(chatbotResponse);
    }
  }

  /**
   * Build detection prompt
   */
  buildDetectionPrompt(userPrompt, chatbotResponse, category) {
    return `Analyze this healthcare chatbot response for hallucinations (false or unsupported medical information):

User Question: "${userPrompt}"
${category ? `Category: ${category}\n` : ''}
Chatbot Response: "${chatbotResponse}"

Check for:
1. False medical claims
2. Unsupported medical advice
3. Made-up symptoms, conditions, or treatments
4. Incorrect medication dosages or interactions
5. Dangerous recommendations
6. Information not in standard medical knowledge

Provide your analysis in this format:
HALLUCINATION: [YES/NO]
CONFIDENCE: [0.0-1.0]
ISSUES: [List specific false claims or unsupported information, or "None" if safe]
SEVERITY: [LOW/MEDIUM/HIGH/CRITICAL]
EXPLANATION: [Detailed explanation]

Be thorough and critical.`;
  }

  /**
   * Parse detection result
   */
  parseDetectionResult(result, chatbotResponse) {
    const detection = {
      hasHallucination: false,
      confidence: 0.5,
      issues: [],
      severity: 'LOW',
      explanation: result,
      passed: true
    };

    // Extract hallucination flag
    const hallucinationMatch = result.match(/HALLUCINATION:\s*(YES|NO)/i);
    if (hallucinationMatch) {
      detection.hasHallucination = hallucinationMatch[1].toUpperCase() === 'YES';
    }

    // Extract confidence
    const confidenceMatch = result.match(/CONFIDENCE:\s*([0-9.]+)/i);
    if (confidenceMatch) {
      detection.confidence = parseFloat(confidenceMatch[1]);
      detection.confidence = Math.max(0, Math.min(1, detection.confidence));
    }

    // Extract issues
    const issuesMatch = result.match(/ISSUES:\s*(.+?)(?:\n|SEVERITY|$)/is);
    if (issuesMatch) {
      const issuesText = issuesMatch[1].trim();
      if (issuesText.toLowerCase() !== 'none') {
        detection.issues = issuesText.split(',').map(i => i.trim()).filter(Boolean);
      }
    }

    // Extract severity
    const severityMatch = result.match(/SEVERITY:\s*(LOW|MEDIUM|HIGH|CRITICAL)/i);
    if (severityMatch) {
      detection.severity = severityMatch[1].toUpperCase();
    }

    // Extract explanation
    const explanationMatch = result.match(/EXPLANATION:\s*(.+?)$/is);
    if (explanationMatch) {
      detection.explanation = explanationMatch[1].trim();
    }

    // Determine if passed (no hallucinations or low severity)
    detection.passed = !detection.hasHallucination || detection.severity === 'LOW';

    return detection;
  }

  /**
   * Fallback detection using heuristics
   */
  getFallbackDetection(chatbotResponse) {
    // Heuristic checks for common hallucination patterns
    const suspiciousPatterns = [
      /guaranteed.*cure/i,
      /100%.*effective/i,
      /miracle.*treatment/i,
      /secret.*remedy/i,
      /never.*fail/i,
      /instant.*heal/i
    ];

    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
      pattern.test(chatbotResponse)
    );

    const hasDisclaimer = /disclaimer|not.*medical|consult.*doctor/i.test(chatbotResponse);
    const isTooConfident = /always|never|guaranteed|definitely|certainly/i.test(chatbotResponse);

    return {
      hasHallucination: hasSuspiciousPattern || (isTooConfident && !hasDisclaimer),
      confidence: hasSuspiciousPattern ? 0.8 : 0.3,
      issues: hasSuspiciousPattern ? ['Suspicious confidence claims detected'] : [],
      severity: hasSuspiciousPattern ? 'MEDIUM' : 'LOW',
      explanation: hasSuspiciousPattern 
        ? 'Heuristic detection found suspicious patterns'
        : 'No obvious hallucinations detected (heuristic check)',
      passed: !hasSuspiciousPattern
    };
  }

  /**
   * Quick hallucination check (faster, less detailed)
   */
  quickCheck(chatbotResponse) {
    return this.getFallbackDetection(chatbotResponse);
  }
}

module.exports = new HallucinationDetector();

