/**
 * Generate Analytics Dashboard
 * Script to generate dashboard from test results
 */

const dashboardGenerator = require('../src/analytics/dashboard-generator');
const metrics = require('../src/utils/metrics');
const fs = require('fs');
const path = require('path');

// Load test results if available
let testResults = [];
const resultsPath = path.join(__dirname, '../reports/results.json');

if (fs.existsSync(resultsPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    // Extract test results from Playwright JSON format
    if (data.suites) {
      testResults = data.suites.flatMap(suite => 
        suite.specs.flatMap(spec => spec.tests || [])
      );
    }
  } catch (error) {
    console.warn('Could not load test results:', error.message);
  }
}

// Generate and save dashboard
const filePath = dashboardGenerator.saveDashboard(testResults);
console.log(`✅ Dashboard generated: ${filePath}`);
console.log(`📊 Open in browser to view analytics`);
