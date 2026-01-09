/**
 * Baseline Manager
 * Stores and compares responses against baselines for regression testing
 */

const fs = require('fs');
const path = require('path');

class BaselineManager {
  constructor() {
    this.baselineDir = path.join(__dirname, '../../baselines');
    this.ensureBaselineDir();
  }

  ensureBaselineDir() {
    if (!fs.existsSync(this.baselineDir)) {
      fs.mkdirSync(this.baselineDir, { recursive: true });
    }
  }

  /**
   * Save baseline response
   * @param {string} testId - Unique test identifier
   * @param {string} prompt - Test prompt
   * @param {string} response - Baseline response
   * @param {object} metadata - Additional metadata
   */
  saveBaseline(testId, prompt, response, metadata = {}) {
    const baseline = {
      testId,
      prompt,
      response,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    const filePath = path.join(this.baselineDir, `${testId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(baseline, null, 2));
  }

  /**
   * Get baseline response
   * @param {string} testId - Test identifier
   * @returns {object|null} Baseline data or null
   */
  getBaseline(testId) {
    const filePath = path.join(this.baselineDir, `${testId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading baseline ${testId}:`, error);
      return null;
    }
  }

  /**
   * Compare response with baseline
   * @param {string} testId - Test identifier
   * @param {string} currentResponse - Current response
   * @param {object} semanticValidator - Optional semantic validator
   * @returns {Promise<object>} Comparison result
   */
  async compareWithBaseline(testId, currentResponse, semanticValidator = null) {
    const baseline = this.getBaseline(testId);
    
    if (!baseline) {
      return {
        hasBaseline: false,
        message: 'No baseline found'
      };
    }

    // Simple text comparison
    const exactMatch = baseline.response === currentResponse;
    const lengthDiff = Math.abs(baseline.response.length - currentResponse.length);
    const lengthSimilar = lengthDiff < baseline.response.length * 0.1; // Within 10%

    let semanticSimilarity = null;
    if (semanticValidator) {
      try {
        semanticSimilarity = await semanticValidator.compareResponses(
          baseline.response,
          currentResponse
        );
      } catch (error) {
        console.warn('Semantic comparison failed:', error);
      }
    }

    const isSimilar = exactMatch || 
                     (semanticSimilarity && semanticSimilarity >= 0.8) ||
                     (lengthSimilar && !exactMatch);

    return {
      hasBaseline: true,
      exactMatch,
      lengthDiff,
      lengthSimilar,
      semanticSimilarity,
      isSimilar,
      baseline: baseline.response,
      current: currentResponse,
      changed: !isSimilar,
      metadata: baseline.metadata
    };
  }

  /**
   * List all baselines
   * @returns {Array<string>} Array of test IDs
   */
  listBaselines() {
    if (!fs.existsSync(this.baselineDir)) {
      return [];
    }

    return fs.readdirSync(this.baselineDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  }

  /**
   * Generate test ID from prompt
   * @param {string} prompt - Test prompt
   * @returns {string} Test ID
   */
  generateTestId(prompt) {
    const hash = require('crypto')
      .createHash('md5')
      .update(prompt)
      .digest('hex')
      .substring(0, 8);
    return `test_${hash}`;
  }
}

module.exports = new BaselineManager();
