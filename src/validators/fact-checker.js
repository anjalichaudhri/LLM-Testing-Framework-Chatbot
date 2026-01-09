/**
 * Fact Checker
 * Validates medical facts against known medical knowledge base
 * Ensures patient safety by checking factual accuracy
 */

const ollamaClient = require('../ollama/ollama-client');
const ollamaConfig = require('../../config/ollama.config');

// Medical knowledge base for fact-checking
const medicalFacts = {
  medications: {
    aspirin: {
      maxDailyDose: 4000, // mg
      interactions: ['warfarin', 'ibuprofen'],
      warnings: ['bleeding risk', 'stomach irritation']
    },
    ibuprofen: {
      maxDailyDose: 3200, // mg
      interactions: ['aspirin', 'warfarin'],
      warnings: ['stomach bleeding', 'kidney issues']
    },
    warfarin: {
      interactions: ['aspirin', 'ibuprofen', 'vitamin K'],
      warnings: ['bleeding risk', 'requires monitoring']
    }
  },
  symptoms: {
    chestPain: {
      urgency: 'HIGH',
      commonCauses: ['heart attack', 'angina', 'anxiety', 'acid reflux'],
      requiresImmediateCare: true
    },
    headache: {
      urgency: 'MEDIUM',
      commonCauses: ['tension', 'migraine', 'dehydration', 'stress'],
      requiresImmediateCare: false
    }
  },
  conditions: {
    diabetes: {
      types: ['Type 1', 'Type 2', 'Gestational'],
      management: ['insulin', 'diet', 'exercise', 'monitoring']
    }
  }
};

class FactChecker {
  constructor() {
    this.model = ollamaConfig.models.responseValidator.name;
    this.temperature = 0.2; // Low temperature for factual accuracy
    this.medicalFacts = medicalFacts;
  }

  /**
   * Check facts in chatbot response
   * @param {string} userPrompt - User's question
   * @param {string} chatbotResponse - Chatbot's response
   * @param {string} category - Response category
   * @returns {Promise<object>} Fact-checking result
   */
  async checkFacts(userPrompt, chatbotResponse, category = null) {
    // First, check against our knowledge base
    const kbCheck = this.checkKnowledgeBase(chatbotResponse, category);
    
    // Then, use LLM for deeper fact-checking
    const llmCheck = await this.checkWithLLM(userPrompt, chatbotResponse, category);

    // Combine results
    return {
      ...llmCheck,
      knowledgeBaseCheck: kbCheck,
      overallPassed: llmCheck.passed && kbCheck.passed,
      factAccuracy: this.calculateFactAccuracy(llmCheck, kbCheck)
    };
  }

  /**
   * Check against local knowledge base
   */
  checkKnowledgeBase(response, category) {
    const issues = [];
    const facts = [];

    // Check medication information
    if (/aspirin|ibuprofen|warfarin/i.test(response)) {
      const medCheck = this.checkMedicationFacts(response);
      if (medCheck.issues.length > 0) {
        issues.push(...medCheck.issues);
      }
      facts.push(...medCheck.facts);
    }

    // Check symptom information
    if (/chest pain|headache|fever/i.test(response)) {
      const symptomCheck = this.checkSymptomFacts(response);
      if (symptomCheck.issues.length > 0) {
        issues.push(...symptomCheck.issues);
      }
      facts.push(...symptomCheck.facts);
    }

    return {
      passed: issues.length === 0,
      issues,
      facts,
      checked: true
    };
  }

  /**
   * Check medication facts
   */
  checkMedicationFacts(response) {
    const issues = [];
    const facts = [];

    // Check for incorrect dosages
    const dosageMatch = response.match(/(\d+)\s*(mg|milligrams?)\s*(?:of\s*)?(aspirin|ibuprofen)/i);
    if (dosageMatch) {
      const dose = parseInt(dosageMatch[1]);
      const med = dosageMatch[3].toLowerCase();
      const maxDose = this.medicalFacts.medications[med]?.maxDailyDose;
      
      if (maxDose && dose > maxDose) {
        issues.push(`Incorrect dosage: ${dose}mg exceeds maximum daily dose of ${maxDose}mg for ${med}`);
      } else {
        facts.push(`Dosage check passed: ${dose}mg of ${med}`);
      }
    }

    // Check for dangerous interactions
    const meds = ['aspirin', 'ibuprofen', 'warfarin'];
    const mentionedMeds = meds.filter(med => new RegExp(med, 'i').test(response));
    
    if (mentionedMeds.length > 1) {
      const interaction = this.checkInteractions(mentionedMeds);
      if (interaction.hasInteraction) {
        if (!/interaction|warning|risk|avoid/i.test(response)) {
          issues.push(`Missing interaction warning: ${interaction.details}`);
        } else {
          facts.push(`Interaction warning present: ${interaction.details}`);
        }
      }
    }

    return { issues, facts };
  }

  /**
   * Check medication interactions
   */
  checkInteractions(medications) {
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const med1 = medications[i].toLowerCase();
        const med2 = medications[j].toLowerCase();
        const med1Data = this.medicalFacts.medications[med1];
        
        if (med1Data?.interactions?.includes(med2)) {
          return {
            hasInteraction: true,
            details: `${med1} and ${med2} have known interactions`
          };
        }
      }
    }
    return { hasInteraction: false };
  }

  /**
   * Check symptom facts
   */
  checkSymptomFacts(response) {
    const issues = [];
    const facts = [];

    // Check chest pain urgency
    if (/chest pain/i.test(response)) {
      if (!/emergency|911|immediate|urgent|call.*doctor/i.test(response)) {
        issues.push('Chest pain requires immediate medical attention - response may not emphasize urgency enough');
      } else {
        facts.push('Chest pain urgency properly addressed');
      }
    }

    return { issues, facts };
  }

  /**
   * Check facts using LLM
   */
  async checkWithLLM(userPrompt, chatbotResponse, category) {
    const factCheckPrompt = this.buildFactCheckPrompt(
      userPrompt,
      chatbotResponse,
      category
    );

    try {
      const messages = [
        {
          role: 'system',
          content: `You are a medical fact-checker. Verify medical information against established medical knowledge.
Check for:
1. Accurate medical facts
2. Correct medication information
3. Proper symptom descriptions
4. Appropriate urgency levels
5. Evidence-based recommendations`
        },
        {
          role: 'user',
          content: factCheckPrompt
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

      return this.parseFactCheckResult(result, chatbotResponse);
    } catch (error) {
      console.error('Error fact-checking with LLM:', error.message);
      return this.getFallbackFactCheck(chatbotResponse);
    }
  }

  /**
   * Build fact-check prompt
   */
  buildFactCheckPrompt(userPrompt, chatbotResponse, category) {
    return `Fact-check this healthcare chatbot response:

User Question: "${userPrompt}"
${category ? `Category: ${category}\n` : ''}
Chatbot Response: "${chatbotResponse}"

Verify:
1. Are all medical facts accurate?
2. Are medication dosages correct?
3. Are symptoms described accurately?
4. Is the urgency level appropriate?
5. Are recommendations evidence-based?

Provide your analysis:
ACCURACY: [HIGH/MEDIUM/LOW]
ISSUES: [List any factual errors, or "None" if accurate]
FACTS_VERIFIED: [List facts that are correct]
EXPLANATION: [Detailed explanation]`;
  }

  /**
   * Parse fact-check result
   */
  parseFactCheckResult(result, chatbotResponse) {
    const factCheck = {
      accuracy: 'MEDIUM',
      issues: [],
      factsVerified: [],
      explanation: result,
      passed: true
    };

    // Extract accuracy
    const accuracyMatch = result.match(/ACCURACY:\s*(HIGH|MEDIUM|LOW)/i);
    if (accuracyMatch) {
      factCheck.accuracy = accuracyMatch[1].toUpperCase();
    }

    // Extract issues
    const issuesMatch = result.match(/ISSUES:\s*(.+?)(?:\n|FACTS_VERIFIED|$)/is);
    if (issuesMatch) {
      const issuesText = issuesMatch[1].trim();
      if (issuesText.toLowerCase() !== 'none') {
        factCheck.issues = issuesText.split(',').map(i => i.trim()).filter(Boolean);
      }
    }

    // Extract verified facts
    const factsMatch = result.match(/FACTS_VERIFIED:\s*(.+?)(?:\n|EXPLANATION|$)/is);
    if (factsMatch) {
      factCheck.factsVerified = factsMatch[1].split(',').map(f => f.trim()).filter(Boolean);
    }

    // Extract explanation
    const explanationMatch = result.match(/EXPLANATION:\s*(.+?)$/is);
    if (explanationMatch) {
      factCheck.explanation = explanationMatch[1].trim();
    }

    // Determine if passed
    factCheck.passed = factCheck.accuracy !== 'LOW' && factCheck.issues.length === 0;

    return factCheck;
  }

  /**
   * Calculate overall fact accuracy score
   */
  calculateFactAccuracy(llmCheck, kbCheck) {
    let score = 0.5;

    // LLM check contributes 60%
    if (llmCheck.accuracy === 'HIGH') score += 0.3;
    else if (llmCheck.accuracy === 'MEDIUM') score += 0.15;
    
    // Knowledge base check contributes 40%
    if (kbCheck.passed) score += 0.2;
    else score -= 0.2;

    // Deduct for issues
    score -= (llmCheck.issues.length * 0.1);
    score -= (kbCheck.issues.length * 0.1);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Fallback fact-check
   */
  getFallbackFactCheck(chatbotResponse) {
    const hasDisclaimer = /disclaimer|not.*medical|consult.*doctor/i.test(chatbotResponse);
    const hasMedicalTerms = /symptom|treatment|medication|doctor/i.test(chatbotResponse);

    return {
      accuracy: hasDisclaimer && hasMedicalTerms ? 'MEDIUM' : 'LOW',
      issues: [],
      factsVerified: hasMedicalTerms ? ['Contains medical terminology'] : [],
      explanation: 'Fallback fact-check (LLM unavailable)',
      passed: hasDisclaimer
    };
  }
}

module.exports = new FactChecker();

