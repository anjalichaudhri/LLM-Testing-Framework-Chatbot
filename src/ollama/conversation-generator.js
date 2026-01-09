/**
 * Advanced Conversation Generator
 * Generates multi-turn conversation scenarios using Model 1
 */

const ollamaClient = require('./ollama-client');
const ollamaConfig = require('../../config/ollama.config');

class ConversationGenerator {
  constructor() {
    this.model = ollamaConfig.models.promptGenerator.name;
    this.temperature = ollamaConfig.models.promptGenerator.temperature;
  }

  /**
   * Generate a multi-turn conversation scenario
   * @param {string} category - Conversation category
   * @param {number} turns - Number of conversation turns
   * @returns {Promise<Array>} Array of conversation messages
   */
  async generateConversation(category = 'symptoms', turns = 3) {
    const systemPrompt = `Generate a realistic ${turns}-turn healthcare conversation.
The conversation should:
1. Start with a user question about ${category}
2. Include natural follow-up questions
3. Build context across turns
4. Be realistic and conversational

Format as JSON array: [{"role": "user", "message": "..."}, {"role": "user", "message": "..."}]
Only return the JSON array, nothing else.`;

    try {
      const response = await ollamaClient.generate(
        this.model,
        systemPrompt,
        {
          temperature: this.temperature,
          maxTokens: 500
        }
      );

      // Try to parse JSON
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const conversation = JSON.parse(jsonMatch[0]);
          return conversation.filter(msg => msg.role === 'user').map(msg => msg.message);
        }
      } catch (e) {
        // Fallback: split by lines or generate sequentially
      }

      // Fallback: Generate turns sequentially
      return await this.generateSequentialTurns(category, turns);
    } catch (error) {
      console.error('Error generating conversation:', error);
      return this.getFallbackConversation(category, turns);
    }
  }

  /**
   * Generate conversation turns sequentially
   */
  async generateSequentialTurns(category, turns) {
    const messages = [];
    let context = '';

    for (let i = 0; i < turns; i++) {
      const prompt = i === 0
        ? `Generate the first message in a healthcare conversation about ${category}.`
        : `Generate the next message in a healthcare conversation. Previous context: ${context}. Make it a natural follow-up.`;

      const message = await ollamaClient.generate(
        this.model,
        prompt,
        { temperature: this.temperature, maxTokens: 100 }
      );

      const cleanMessage = this.cleanPrompt(message);
      messages.push(cleanMessage);
      context += cleanMessage + ' ';
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return messages;
  }

  /**
   * Generate edge case prompts
   * @returns {Array<string>} Array of edge case prompts
   */
  generateEdgeCases() {
    return [
      '', // Empty
      'a'.repeat(1000), // Very long
      '!@#$%^&*()', // Special characters
      '🚑🏥💊', // Emojis
      'null', // Null string
      'undefined', // Undefined string
      '   ', // Whitespace only
      '\n\n\n', // Newlines only
      'SELECT * FROM users', // SQL injection attempt
      '<script>alert("xss")</script>', // XSS attempt
      'I have a headache' + ' '.repeat(500) + 'and nausea', // Long with spaces
      'A'.repeat(50) + ' headache ' + 'B'.repeat(50), // Mixed long
    ];
  }

  /**
   * Generate stress test prompts
   * @param {number} count - Number of rapid prompts
   * @returns {Array<string>} Array of prompts
   */
  async generateStressTestPrompts(count = 10) {
    const prompts = [];
    const categories = ['symptoms', 'appointment', 'medication', 'wellness'];
    
    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      const prompt = await ollamaClient.generate(
        this.model,
        `Generate a short ${category} question.`,
        { temperature: 0.9, maxTokens: 50 }
      );
      prompts.push(this.cleanPrompt(prompt));
    }
    
    return prompts;
  }

  /**
   * Generate context-aware prompt
   * @param {Array<string>} conversationHistory - Previous messages
   * @param {string} category - Current category
   * @returns {Promise<string>} Context-aware prompt
   */
  async generateContextAwarePrompt(conversationHistory, category) {
    const history = conversationHistory.slice(-3).join(' | ');
    const prompt = `Generate a follow-up question in a healthcare conversation.
Previous conversation: ${history}
Category: ${category}
Make it a natural continuation that references the previous context.`;

    try {
      const response = await ollamaClient.generate(
        this.model,
        prompt,
        { temperature: this.temperature, maxTokens: 100 }
      );
      return this.cleanPrompt(response);
    } catch (error) {
      return `Tell me more about that`;
    }
  }

  cleanPrompt(prompt) {
    let cleaned = prompt.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1);
    }
    cleaned = cleaned.replace(/^(User|Question|Prompt):\s*/i, '');
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    if (!/[.!?]$/.test(cleaned)) {
      cleaned += '?';
    }
    return cleaned.trim();
  }

  getFallbackConversation(category, turns) {
    const fallbacks = {
      symptoms: [
        'I have a headache',
        'It started yesterday',
        'The pain is moderate'
      ],
      appointment: [
        'I need an appointment',
        'Next week would work',
        'For a checkup'
      ],
      medication: [
        'Can I take aspirin?',
        'I also take ibuprofen',
        'Are there interactions?'
      ]
    };

    const base = fallbacks[category] || fallbacks.symptoms;
    return base.slice(0, turns);
  }
}

module.exports = new ConversationGenerator();
