# Ollama Usage in Playwright Tests - Summary

## ✅ YES - We ARE Using Ollama!

### Model 1 (llama2:latest) - Prompt Generation

**Used in:**
- ✅ `response-quality.spec.js` - Line 139
  ```javascript
  const generatedPrompts = await promptGenerator.generatePrompts(3, 'symptoms');
  ```
  - Generates diverse, realistic test prompts dynamically
  - Tests chatbot with AI-generated scenarios

- ✅ `appointment-flow.spec.js` - NEW TEST ADDED
  ```javascript
  const generatedPrompts = await promptGenerator.generatePrompts(2, 'appointment');
  ```
  - Now also generates appointment prompts dynamically

### Model 2 (gpt-oss:20b) - Response Validation

**Used in:**
- ✅ `response-quality.spec.js` - Multiple times
  ```javascript
  const validation = await responseValidator.validateResponse(
    prompt,
    botResponse,
    category
  );
  ```
  - Validates all chatbot responses
  - Provides quality scores (0-1)
  - Checks accuracy, completeness, safety, relevance

- ✅ `appointment-flow.spec.js` - Line 85
  ```javascript
  const validation = await responseValidator.validateResponse(...);
  ```
  - Validates appointment flow responses

## Test Flow

```
┌─────────────────┐
│  Model 1        │───► Generate Test Prompt
│  (llama2)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Playwright     │───► Send to Healthcare Chatbot
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
│  Test Result    │───► Pass/Fail with Score
└─────────────────┘
```

## Examples

### Example 1: AI-Generated Prompt Test
```javascript
// Model 1 generates: "I've been feeling really tired and dizzy lately..."
const prompt = await promptGenerator.generatePrompt('symptoms');

// Send to chatbot via Playwright
await chatbotPage.sendMessage(prompt);
const response = await chatbotPage.getLatestBotMessage();

// Model 2 validates: Score 85%, Passed ✅
const validation = await responseValidator.validateResponse(prompt, response, 'symptoms');
```

### Example 2: Response Quality Validation
```javascript
// Model 2 evaluates response
const validation = await responseValidator.validateResponse(
  'What are flu symptoms?',
  chatbotResponse,
  'symptoms'
);

// Result:
// - Score: 0.85 (85%)
// - Accuracy: "Factually correct"
// - Completeness: "Covers main symptoms"
// - Safety: "Includes disclaimer"
// - Passed: true
```

## Status

✅ **Model 1 (Prompt Generation)**: Fully integrated and working
✅ **Model 2 (Response Validation)**: Fully integrated and working
✅ **Both models are actively used in tests**

## Benefits

1. **Diverse Testing**: AI generates varied, realistic prompts
2. **Quality Assurance**: LLM validates response quality objectively
3. **Automated**: No need to manually write all test cases
4. **Scalable**: Can generate unlimited test scenarios
5. **Intelligent**: LLM understands context and medical appropriateness
