/**
 * Performance Metrics Utilities
 * Track and analyze test performance
 */

class Metrics {
  constructor() {
    this.metrics = {
      responseTimes: [],
      testResults: [],
      startTime: null,
      endTime: null
    };
  }

  /**
   * Start timing
   */
  start() {
    this.metrics.startTime = Date.now();
  }

  /**
   * End timing
   */
  end() {
    this.metrics.endTime = Date.now();
  }

  /**
   * Record response time
   * @param {number} time - Response time in milliseconds
   */
  recordResponseTime(time) {
    this.metrics.responseTimes.push(time);
  }

  /**
   * Record test result
   * @param {object} result - Test result object
   */
  recordTestResult(result) {
    this.metrics.testResults.push({
      ...result,
      timestamp: Date.now()
    });
  }

  /**
   * Get average response time
   * @returns {number} Average response time in milliseconds
   */
  getAverageResponseTime() {
    if (this.metrics.responseTimes.length === 0) return 0;
    const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.responseTimes.length);
  }

  /**
   * Get median response time
   * @returns {number} Median response time in milliseconds
   */
  getMedianResponseTime() {
    const times = [...this.metrics.responseTimes].sort((a, b) => a - b);
    if (times.length === 0) return 0;
    const mid = Math.floor(times.length / 2);
    return times.length % 2 === 0
      ? (times[mid - 1] + times[mid]) / 2
      : times[mid];
  }

  /**
   * Get min response time
   * @returns {number} Minimum response time
   */
  getMinResponseTime() {
    return this.metrics.responseTimes.length > 0
      ? Math.min(...this.metrics.responseTimes)
      : 0;
  }

  /**
   * Get max response time
   * @returns {number} Maximum response time
   */
  getMaxResponseTime() {
    return this.metrics.responseTimes.length > 0
      ? Math.max(...this.metrics.responseTimes)
      : 0;
  }

  /**
   * Get pass rate
   * @returns {number} Pass rate (0-1)
   */
  getPassRate() {
    if (this.metrics.testResults.length === 0) return 0;
    const passed = this.metrics.testResults.filter(r => r.passed).length;
    return passed / this.metrics.testResults.length;
  }

  /**
   * Get average quality score
   * @returns {number} Average quality score (0-1)
   */
  getAverageQualityScore() {
    const scores = this.metrics.testResults
      .map(r => r.validation?.score)
      .filter(s => typeof s === 'number');
    
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return sum / scores.length;
  }

  /**
   * Get summary statistics
   * @returns {object} Summary statistics
   */
  getSummary() {
    return {
      totalTests: this.metrics.testResults.length,
      passedTests: this.metrics.testResults.filter(r => r.passed).length,
      failedTests: this.metrics.testResults.filter(r => !r.passed).length,
      passRate: this.getPassRate(),
      averageQualityScore: this.getAverageQualityScore(),
      responseTime: {
        average: this.getAverageResponseTime(),
        median: this.getMedianResponseTime(),
        min: this.getMinResponseTime(),
        max: this.getMaxResponseTime(),
        count: this.metrics.responseTimes.length
      },
      duration: this.metrics.endTime && this.metrics.startTime
        ? this.metrics.endTime - this.metrics.startTime
        : null
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      responseTimes: [],
      testResults: [],
      startTime: null,
      endTime: null
    };
  }

  /**
   * Export metrics to JSON
   * @returns {object} Metrics data
   */
  export() {
    return {
      ...this.metrics,
      summary: this.getSummary()
    };
  }
}

module.exports = new Metrics();
