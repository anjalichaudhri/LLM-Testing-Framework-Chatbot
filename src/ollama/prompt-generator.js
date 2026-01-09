/**
 * Prompt Generator using Model 1 (llama2:latest)
 * Generates diverse, realistic test prompts for healthcare chatbot
 */

const ollamaClient = require('./ollama-client');
const ollamaConfig = require('../../config/ollama.config');

class PromptGenerator {
  constructor() {
    this.model = ollamaConfig.models.promptGenerator.name;
    this.temperature = ollamaConfig.models.promptGenerator.temperature;
    this.maxTokens = ollamaConfig.models.promptGenerator.maxTokens;
    this.systemPrompt = ollamaConfig.models.promptGenerator.systemPrompt;
  }

  /**
   * Generate a single test prompt
   * @param {string} category - Prompt category (symptoms, appointment, medication, wellness, emergency)
   * @returns {Promise<string>} Generated prompt
   */
  async generatePrompt(category = null) {
    const categoryPrompt = category 
      ? `Generate a ${category}-related healthcare question.`
      : 'Generate a diverse healthcare question.';

    const fullPrompt = `${this.systemPrompt}\n\n${categoryPrompt}\n\nGenerate only the user question, nothing else:`;

    try {
      const prompt = await ollamaClient.generate(
        this.model,
        fullPrompt,
        {
          temperature: this.temperature,
          maxTokens: this.maxTokens
        }
      );

      // Clean up the prompt (remove quotes, extra text)
      return this.cleanPrompt(prompt);
    } catch (error) {
      console.error('Error generating prompt:', error.message);
      // Fallback to predefined prompts
      return this.getFallbackPrompt(category);
    }
  }

  /**
   * Generate multiple test prompts
   * @param {number} count - Number of prompts to generate
   * @param {string} category - Optional category filter
   * @returns {Promise<Array<string>>} Array of prompts
   */
  async generatePrompts(count = 5, category = null) {
    const prompts = [];
    for (let i = 0; i < count; i++) {
      const prompt = await this.generatePrompt(category);
      prompts.push(prompt);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return prompts;
  }

  /**
   * Generate prompt for specific test scenario
   * @param {object} scenario - Test scenario object
   * @returns {Promise<string>} Generated prompt
   */
  async generateScenarioPrompt(scenario) {
    const scenarioPrompt = `Generate a healthcare question for this scenario:
Category: ${scenario.category}
Context: ${scenario.context || 'General healthcare'}
Type: ${scenario.type || 'Question'}

Generate only the user question:`;

    try {
      const prompt = await ollamaClient.generate(
        this.model,
        scenarioPrompt,
        {
          temperature: this.temperature,
          maxTokens: this.maxTokens
        }
      );

      return this.cleanPrompt(prompt);
    } catch (error) {
      console.error('Error generating scenario prompt:', error.message);
      return scenario.fallback || this.getFallbackPrompt(scenario.category);
    }
  }

  /**
   * Clean and normalize generated prompt
   * @param {string} prompt - Raw prompt
   * @returns {string} Cleaned prompt
   */
  cleanPrompt(prompt) {
    // Remove quotes if wrapped
    let cleaned = prompt.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1);
    }

    // Remove "User:" or "Question:" prefixes
    cleaned = cleaned.replace(/^(User|Question|Prompt):\s*/i, '');

    // Remove markdown formatting
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/`/g, '');

    // Ensure it ends with proper punctuation
    if (!/[.!?]$/.test(cleaned)) {
      cleaned += '?';
    }

    return cleaned.trim();
  }

  /**
   * Get fallback prompt if generation fails
   * @param {string} category - Prompt category
   * @returns {string} Fallback prompt
   */
  getFallbackPrompt(category) {
    const fallbacks = {
      symptoms: [
        "What are the symptoms of flu?",
        "I have a headache, what should I do?",
        "What causes chest pain?"
      ],
      appointment: [
        "I need to schedule an appointment",
        "How can I book a doctor's appointment?",
        "I want to see a cardiologist"
      ],
      medication: [
        "Can I take aspirin with ibuprofen?",
        "What are the side effects of this medication?",
        "How should I take my prescription?"
      ],
      wellness: [
        "What are some healthy eating tips?",
        "How much exercise should I do?",
        "What can I do to improve my sleep?"
      ],
      emergency: [
        "I'm having severe chest pain",
        "I can't breathe properly",
        "I think I'm having a heart attack"
      ]
    };

    const categoryPrompts = fallbacks[category] || Object.values(fallbacks).flat();
    return categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
  }
}

module.exports = new PromptGenerator();
