/**
 * Semantic Similarity Validator
 * Uses embeddings to compare response similarity
 */

const ollamaClient = require('../ollama/ollama-client');
const ollamaConfig = require('../../config/ollama.config');

class SemanticValidator {
  constructor() {
    this.model = ollamaConfig.models.responseValidator.name;
  }

  /**
   * Get embeddings for text using Ollama
   * @param {string} text - Text to embed
   * @returns {Promise<Array<number>>} Embedding vector
   */
  async getEmbedding(text) {
    try {
      // Ollama embeddings endpoint
      const response = await require('axios').post(
        `${ollamaConfig.ollama.baseUrl}/api/embeddings`,
        {
          model: this.model,
          prompt: text
        },
        { timeout: 30000 }
      );

      return response.data.embedding || [];
    } catch (error) {
      console.warn('Embeddings not available, using fallback');
      return this.fallbackEmbedding(text);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {Array<number>} vec1 - First embedding
   * @param {Array<number>} vec2 - Second embedding
   * @returns {number} Similarity score (0-1)
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length || vec1.length === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Compare two responses semantically
   * @param {string} response1 - First response
   * @param {string} response2 - Second response
   * @returns {Promise<number>} Similarity score (0-1)
   */
  async compareResponses(response1, response2) {
    try {
      const [embedding1, embedding2] = await Promise.all([
        this.getEmbedding(response1),
        this.getEmbedding(response2)
      ]);

      return this.cosineSimilarity(embedding1, embedding2);
    } catch (error) {
      console.error('Error comparing responses:', error);
      return this.fallbackSimilarity(response1, response2);
    }
  }

  /**
   * Compare response against baseline
   * @param {string} response - Current response
   * @param {string} baseline - Baseline response
   * @returns {Promise<object>} Comparison result
   */
  async compareWithBaseline(response, baseline) {
    const similarity = await this.compareResponses(response, baseline);
    
    return {
      similarity,
      isSimilar: similarity >= 0.7, // 70% similarity threshold
      difference: 1 - similarity,
      status: similarity >= 0.9 ? 'identical' :
              similarity >= 0.7 ? 'similar' :
              similarity >= 0.5 ? 'different' : 'very_different'
    };
  }

  /**
   * Fallback embedding (simple word-based)
   */
  fallbackEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(100).fill(0);
    
    words.forEach((word, i) => {
      const hash = this.simpleHash(word);
      embedding[hash % 100] += 1;
    });

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Fallback similarity (word overlap)
   */
  fallbackSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

module.exports = new SemanticValidator();
