/**
 * Ollama API Client
 * Wrapper for interacting with Ollama API
 */

const axios = require('axios');
const ollamaConfig = require('../../config/ollama.config');

class OllamaClient {
  constructor() {
    this.baseUrl = ollamaConfig.ollama.baseUrl;
    this.timeout = ollamaConfig.ollama.timeout;
  }

  /**
   * Generate text using Ollama model
   * @param {string} model - Model name
   * @param {string} prompt - Input prompt
   * @param {object} options - Generation options
   * @returns {Promise<string>} Generated text
   */
  async generate(model, prompt, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 200,
            ...options
          }
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.response.trim();
    } catch (error) {
      console.error(`Ollama API Error (${model}):`, error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Chat completion using Ollama model
   * @param {string} model - Model name
   * @param {Array} messages - Conversation messages
   * @param {object} options - Generation options
   * @returns {Promise<string>} Model response
   */
  async chat(model, messages, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model,
          messages,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 200,
            ...options
          }
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.message.content.trim();
    } catch (error) {
      console.error(`Ollama Chat Error (${model}):`, error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Check if Ollama is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models
   * @returns {Promise<Array>}
   */
  async listModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 10000
      });
      return response.data.models || [];
    } catch (error) {
      console.error('Error listing models:', error.message);
      return [];
    }
  }

  /**
   * Check if a specific model is available
   * @param {string} modelName - Model name to check
   * @returns {Promise<boolean>}
   */
  async hasModel(modelName) {
    const models = await this.listModels();
    return models.some(model => 
      model.name === modelName || 
      model.name.startsWith(modelName + ':')
    );
  }
}

module.exports = new OllamaClient();
