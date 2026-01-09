# LLM Testing Framework

AI-powered testing framework for Healthcare Chatbot using Playwright and Ollama.

## Architecture

This framework uses a **two-model approach**:

1. **Model 1 (`llama2:latest`)**: Generates diverse test prompts
2. **Model 2 (`gpt-oss:20b`)**: Validates chatbot response quality

## Features

- 🤖 **AI-Powered Test Generation**: Automatically creates realistic test scenarios
- ✅ **Response Quality Validation**: Evaluates chatbot responses using LLM
- 🎭 **UI/UX Testing**: Comprehensive browser automation with Playwright
- 📊 **Detailed Reporting**: HTML reports with quality scores and metrics
- 🔄 **End-to-End Testing**: Full conversation flow testing

## Prerequisites

- Node.js (v16+)
- Ollama installed and running
- Healthcare Chatbot running on `http://localhost:3000`
- Ollama models:
  - `llama2:latest` (for prompt generation)
  - `gpt-oss:20b` (for response validation)

## Installation

```bash
npm install
npx playwright install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:response-quality
npm run test:appointment
npm run test:ui-interactions

# Run with UI mode
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed
```

## Test Reports

View HTML reports:
```bash
npm run report
```

Reports are generated in `reports/html/`

## Project Structure

```
LLM-Testing-Framework/
├── src/
│   ├── ollama/           # Ollama integration
│   ├── playwright/       # Playwright helpers
│   ├── validators/       # Response validators
│   └── utils/           # Utilities
├── tests/
│   └── e2e/             # End-to-end tests
├── config/              # Configuration files
└── reports/             # Test reports
```

## How It Works

1. **Prompt Generation**: Model 1 generates test prompts
2. **Automation**: Playwright sends prompts to Healthcare Chatbot
3. **Response Capture**: Chatbot responses are captured
4. **Validation**: Model 2 evaluates response quality
5. **Reporting**: Results are compiled into reports

## Success Criteria

- Response quality score > 0.7 (70%)
- Medical accuracy validated
- UI interactions functional
- Performance within limits

## See Also

- [Project Architecture](PROJECT_ARCHITECTURE.md)
- [Healthcare Chatbot](../CreateChatbots/README.md)
