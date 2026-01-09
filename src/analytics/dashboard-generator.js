/**
 * Advanced Analytics Dashboard Generator
 * Creates HTML dashboards with charts and metrics
 */

const fs = require('fs');
const path = require('path');
const metrics = require('../utils/metrics');
const performanceBenchmark = require('../utils/performance-benchmark');

class DashboardGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../reports/dashboards');
    this.ensureReportsDir();
  }

  ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate HTML dashboard
   * @param {object} testResults - Test results data
   * @returns {string} HTML dashboard content
   */
  generateDashboard(testResults = []) {
    const summary = metrics.getSummary();
    const performance = performanceBenchmark.getReport();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LLM Testing Framework - Analytics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .stat-card .value {
            font-size: 32px;
            font-weight: bold;
            color: #333;
        }
        .stat-card .label {
            font-size: 12px;
            color: #999;
            margin-top: 5px;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .chart-container h2 {
            margin-bottom: 20px;
            color: #333;
        }
        canvas {
            max-height: 400px;
        }
        .success { color: #10b981; }
        .warning { color: #f59e0b; }
        .error { color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 LLM Testing Framework - Analytics Dashboard</h1>
            <p>Generated at: ${new Date().toLocaleString()}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Tests</h3>
                <div class="value">${summary.totalTests || 0}</div>
                <div class="label">Tests executed</div>
            </div>
            <div class="stat-card">
                <h3>Pass Rate</h3>
                <div class="value ${(summary.passRate || 0) >= 0.8 ? 'success' : (summary.passRate || 0) >= 0.6 ? 'warning' : 'error'}">
                    ${((summary.passRate || 0) * 100).toFixed(1)}%
                </div>
                <div class="label">${summary.passedTests || 0} passed, ${summary.failedTests || 0} failed</div>
            </div>
            <div class="stat-card">
                <h3>Average Quality Score</h3>
                <div class="value ${(summary.averageQualityScore || 0) >= 0.7 ? 'success' : (summary.averageQualityScore || 0) >= 0.5 ? 'warning' : 'error'}">
                    ${((summary.averageQualityScore || 0) * 100).toFixed(1)}%
                </div>
                <div class="label">Response quality</div>
            </div>
            <div class="stat-card">
                <h3>Avg Response Time</h3>
                <div class="value">${summary.responseTime?.average || 0}ms</div>
                <div class="label">P95: ${summary.responseTime?.p95 || 0}ms</div>
            </div>
        </div>

        <div class="chart-container">
            <h2>Response Time Distribution</h2>
            <canvas id="responseTimeChart"></canvas>
        </div>

        <div class="chart-container">
            <h2>Quality Score Distribution</h2>
            <canvas id="qualityScoreChart"></canvas>
        </div>
    </div>

    <script>
        const responseTimes = ${JSON.stringify((performance.responseTimes || []).map(r => r.time))};
        const qualityScores = ${JSON.stringify((testResults || []).map(r => r.validation?.score || 0).filter(s => s > 0))};
        
        // Response Time Chart
        const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
        new Chart(responseTimeCtx, {
            type: 'line',
            data: {
                labels: responseTimes.map((_, i) => \`Test \${i + 1}\`),
                datasets: [{
                    label: 'Response Time (ms)',
                    data: responseTimes,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Quality Score Chart
        const qualityScoreCtx = document.getElementById('qualityScoreChart').getContext('2d');
        new Chart(qualityScoreCtx, {
            type: 'bar',
            data: {
                labels: qualityScores.map((_, i) => \`Test \${i + 1}\`),
                datasets: [{
                    label: 'Quality Score',
                    data: qualityScores,
                    backgroundColor: qualityScores.map(s => s >= 0.7 ? 'rgba(16, 185, 129, 0.5)' : s >= 0.5 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.5)')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true, max: 1 }
                }
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Save dashboard to file
   * @param {object} testResults - Test results
   * @returns {string} File path
   */
  saveDashboard(testResults = []) {
    const html = this.generateDashboard(testResults);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(this.reportsDir, \`dashboard-\${timestamp}.html\`);
    
    fs.writeFileSync(filePath, html);
    return filePath;
  }
}

module.exports = new DashboardGenerator();
