const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Healthcare Chatbot Testing
 */
module.exports = defineConfig({
  testDir: './tests',
  
  // Timeout for each test
  timeout: 120000, // 2 minutes (for LLM responses)
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
  
  // Number of workers
  workers: process.env.CI ? 1 : 1, // Run sequentially for LLM tests
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list']
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for the Healthcare Chatbot
    baseURL: process.env.CHATBOT_URL || 'http://localhost:3000',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Trace on failure
    trace: 'retain-on-failure',
    
    // Viewport size
    viewport: { width: 1280, height: 720 },
  },
  
  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  // Web server configuration (if needed)
  webServer: {
    command: 'echo "Ensure Healthcare Chatbot is running on http://localhost:3000"',
    port: 3000,
    reuseExistingServer: true,
  },
});
