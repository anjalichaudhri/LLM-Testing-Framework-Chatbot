/**
 * Performance Benchmarking Utilities
 * Tracks and analyzes response times and performance metrics
 */

class PerformanceBenchmark {
  constructor() {
    this.benchmarks = {
      responseTimes: [],
      p50: null,
      p95: null,
      p99: null,
      average: null,
      min: null,
      max: null
    };
    this.baseline = null;
  }

  /**
   * Record a response time
   * @param {number} time - Response time in milliseconds
   * @param {string} testName - Name of the test
   */
  record(time, testName = 'unknown') {
    this.benchmarks.responseTimes.push({
      time,
      testName,
      timestamp: Date.now()
    });

    // Keep only last 1000 measurements
    if (this.benchmarks.responseTimes.length > 1000) {
      this.benchmarks.responseTimes.shift();
    }

    this.recalculate();
  }

  /**
   * Recalculate statistics
   */
  recalculate() {
    const times = this.benchmarks.responseTimes.map(r => r.time);
    if (times.length === 0) return;

    // Sort for percentile calculation
    const sorted = [...times].sort((a, b) => a - b);

    this.benchmarks.min = sorted[0];
    this.benchmarks.max = sorted[sorted.length - 1];
    this.benchmarks.average = times.reduce((a, b) => a + b, 0) / times.length;
    this.benchmarks.p50 = this.percentile(sorted, 50);
    this.benchmarks.p95 = this.percentile(sorted, 95);
    this.benchmarks.p99 = this.percentile(sorted, 99);
  }

  /**
   * Calculate percentile
   */
  percentile(sorted, p) {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Set performance baseline
   */
  setBaseline() {
    this.baseline = {
      average: this.benchmarks.average,
      p95: this.benchmarks.p95,
      p99: this.benchmarks.p99,
      timestamp: Date.now()
    };
  }

  /**
   * Compare current performance with baseline
   * @returns {object} Comparison result
   */
  compareWithBaseline() {
    if (!this.baseline) {
      return { hasBaseline: false };
    }

    const currentAvg = this.benchmarks.average;
    const baselineAvg = this.baseline.average;
    const diff = currentAvg - baselineAvg;
    const percentChange = (diff / baselineAvg) * 100;

    return {
      hasBaseline: true,
      currentAverage: currentAvg,
      baselineAverage: baselineAvg,
      difference: diff,
      percentChange,
      isSlower: diff > 0,
      isFaster: diff < 0,
      regression: diff > baselineAvg * 0.2, // 20% slower = regression
      improvement: diff < -baselineAvg * 0.1 // 10% faster = improvement
    };
  }

  /**
   * Get performance report
   * @returns {object} Performance report
   */
  getReport() {
    return {
      ...this.benchmarks,
      baseline: this.baseline,
      comparison: this.compareWithBaseline(),
      totalMeasurements: this.benchmarks.responseTimes.length
    };
  }

  /**
   * Check if performance is acceptable
   * @param {number} maxAverage - Maximum acceptable average (ms)
   * @param {number} maxP95 - Maximum acceptable p95 (ms)
   * @returns {object} Performance check result
   */
  checkPerformance(maxAverage = 5000, maxP95 = 10000) {
    const report = this.getReport();
    
    return {
      passed: report.average <= maxAverage && report.p95 <= maxP95,
      averageOk: report.average <= maxAverage,
      p95Ok: report.p95 <= maxP95,
      average: report.average,
      p95: report.p95,
      thresholds: {
        maxAverage,
        maxP95
      }
    };
  }

  /**
   * Reset all benchmarks
   */
  reset() {
    this.benchmarks = {
      responseTimes: [],
      p50: null,
      p95: null,
      p99: null,
      average: null,
      min: null,
      max: null
    };
  }
}

module.exports = new PerformanceBenchmark();
