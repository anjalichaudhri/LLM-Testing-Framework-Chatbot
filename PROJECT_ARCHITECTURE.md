# LLM Testing Framework Architecture

## Overview
This framework tests the Healthcare Chatbot using Playwright for automation and Ollama for AI-powered testing.

## Two-Model Approach

### Model 1: Prompt Generator (`llama2:latest`)
**Purpose:** Generate diverse, realistic test prompts
**Usage:**
- Creates test scenarios (symptoms, appointments, medications, etc.)
- Generates edge cases and variations
- Produces contextually relevant healthcare queries

### Model 2: Response Validator (`gpt-oss:20b`)
**Purpose:** Evaluate chatbot response quality
**Usage:**
- Analyzes chatbot responses for accuracy
- Checks medical appropriateness
- Validates completeness and relevance
- Scores response quality (0-1)

## Testing Flow

```
┌─────────────────┐
│  Model 1        │
│  (llama2)       │───► Generate Test Prompt
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Playwright     │───► Send prompt to Healthcare Chatbot
│  Browser        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Healthcare     │───► Get Response
│  Chatbot        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Model 2        │───► Validate Response Quality
│  (gpt-oss:20b)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Test Report    │───► Pass/Fail with Scores
└─────────────────┘
```

## Test Types

1. **Response Quality Tests**
   - Medical accuracy
   - Completeness
   - Relevance
   - Safety (disclaimers)

2. **UI/UX Tests**
   - Button functionality
   - Quick actions
   - Appointment flow
   - Error handling

3. **Performance Tests**
   - Response time
   - Load handling
   - Concurrent users

4. **Edge Case Tests**
   - Invalid inputs
   - Long conversations
   - Special characters
   - Rapid messages

## Project Structure

```
LLM-Testing-Framework/
├── src/
│   ├── ollama/
│   │   ├── prompt-generator.js    # Model 1: Generate test prompts
│   │   ├── response-validator.js  # Model 2: Validate responses
│   │   └── ollama-client.js      # Ollama API wrapper
│   ├── playwright/
│   │   ├── chatbot-page.js        # Page object for chatbot
│   │   └── helpers.js             # Playwright utilities
│   ├── validators/
│   │   ├── quality-validator.js   # Response quality checks
│   │   └── ui-validator.js        # UI/UX checks
│   └── utils/
│       ├── similarity.js          # Text similarity
│       └── metrics.js             # Performance metrics
├── tests/
│   ├── e2e/
│   │   ├── response-quality.spec.js
│   │   ├── appointment-flow.spec.js
│   │   └── ui-interactions.spec.js
│   └── fixtures/
│       └── test-scenarios.js
├── config/
│   ├── playwright.config.js
│   ├── ollama.config.js
│   └── test-config.json
├── reports/
└── package.json
```

## Configuration

### Ollama Models
- **Prompt Generator:** `llama2:latest` (7B, faster, good for generation)
- **Response Validator:** `gpt-oss:20b` (20.9B, more accurate, better for evaluation)

### Healthcare Chatbot
- **URL:** `http://localhost:3000`
- **API:** `http://localhost:3000/api/chat`

## Test Execution Flow

1. **Setup:** Start Healthcare Chatbot, verify Ollama models
2. **Generate:** Model 1 creates test prompts
3. **Execute:** Playwright sends prompts to chatbot
4. **Validate:** Model 2 evaluates responses
5. **Report:** Generate test report with scores

## Success Criteria

- Response quality score > 0.7 (70%)
- Medical accuracy validated
- UI interactions work correctly
- Performance within acceptable limits
- Edge cases handled gracefully
