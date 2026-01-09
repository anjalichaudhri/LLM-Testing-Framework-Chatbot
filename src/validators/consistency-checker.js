/**
 * Consistency Checker
 * Ensures chatbot gives consistent responses to the same question
 * Critical for reliability and trust
 */

const semanticValidator = require('./semantic-validator');

class ConsistencyChecker {
  constructor() {
    this.responseCache = new Map(); // Cache responses for comparison
    this.similarityThreshold = 0.75; // 75% similarity for consistency
  }

  /**
   * Check consistency of response
   * @param {string} prompt - User prompt
   * @param {string} currentResponse - Current chatbot response
   * @param {string} previousResponse - Previous response to same prompt (optional)
   * @returns {Promise<object>} Consistency check result
   */
  async checkConsistency(prompt, currentResponse, previousResponse = null) {
    // Normalize prompt for cache key
    const cacheKey = this.normalizePrompt(prompt);

    // Get previous response from cache if not provided
    if (!previousResponse && this.responseCache.has(cacheKey)) {
      previousResponse = this.responseCache.get(cacheKey);
    }

    // If no previous response, this is first time - store and pass
    if (!previousResponse) {
      this.responseCache.set(cacheKey, currentResponse);
      return {
        isConsistent: true,
        similarity: 1.0,
        passed: true,
        message: 'First response - no comparison available',
        previousResponse: null,
        currentResponse
      };
    }

    // Compare responses
    const comparison = await semanticValidator.compareResponses(
      previousResponse,
      currentResponse
    );

    const isConsistent = comparison.similarity >= this.similarityThreshold;

    // Update cache with latest response
    this.responseCache.set(cacheKey, currentResponse);

    return {
      isConsistent,
      similarity: comparison.similarity,
      passed: isConsistent,
      message: isConsistent 
        ? `Responses are consistent (${(comparison.similarity * 100).toFixed(1)}% similar)`
        : `Responses differ significantly (${(comparison.similarity * 100).toFixed(1)}% similar)`,
      previousResponse,
      currentResponse,
      differences: this.findDifferences(previousResponse, currentResponse)
    };
  }

  /**
   * Normalize prompt for consistent caching
   */
  normalizePrompt(prompt) {
    return prompt
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Find key differences between responses
   */
  findDifferences(response1, response2) {
    const words1 = new Set(response1.toLowerCase().split(/\s+/));
    const words2 = new Set(response2.toLowerCase().split(/\s+/));

    const onlyIn1 = [...words1].filter(w => !words2.has(w));
    const onlyIn2 = [...words2].filter(w => !words1.has(w));

    return {
      uniqueToFirst: onlyIn1.slice(0, 10), // Top 10 unique words
      uniqueToSecond: onlyIn2.slice(0, 10)
    };
  }

  /**
   * Test consistency with multiple runs
   * @param {Function} getResponse - Function that returns chatbot response
   * @param {string} prompt - Test prompt
   * @param {number} runs - Number of times to test
   * @returns {Promise<object>} Consistency test results
   */
  async testConsistency(getResponse, prompt, runs = 3) {
    const responses = [];
    const comparisons = [];

    // Get multiple responses
    for (let i = 0; i < runs; i++) {
      const response = await getResponse(prompt);
      responses.push(response);
    }

    // Compare all pairs
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const comparison = await semanticValidator.compareResponses(
          responses[i],
          responses[j]
        );
        comparisons.push(comparison.similarity);
      }
    }

    // Calculate statistics
    const avgSimilarity = comparisons.reduce((a, b) => a + b, 0) / comparisons.length;
    const minSimilarity = Math.min(...comparisons);
    const maxSimilarity = Math.max(...comparisons);

    const isConsistent = avgSimilarity >= this.similarityThreshold;

    return {
      isConsistent,
      averageSimilarity: avgSimilarity,
      minSimilarity,
      maxSimilarity,
      passed: isConsistent,
      runs,
      responses,
      message: isConsistent
        ? `Consistent across ${runs} runs (avg ${(avgSimilarity * 100).toFixed(1)}% similar)`
        : `Inconsistent across ${runs} runs (avg ${(avgSimilarity * 100).toFixed(1)}% similar)`
    };
  }

  /**
   * Clear response cache
   */
  clearCache() {
    this.responseCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.responseCache.size,
      keys: Array.from(this.responseCache.keys()).slice(0, 10) // First 10 keys
    };
  }
}

module.exports = new ConsistencyChecker();

