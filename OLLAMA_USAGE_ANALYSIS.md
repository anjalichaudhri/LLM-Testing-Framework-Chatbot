# Ollama Usage Analysis in Tests

## Current Status

### ✅ Response Quality Tests (`response-quality.spec.js`)
**FULLY USING OLLAMA:**
- ✅ **Model 1 (llama2:latest)**: Used to generate test prompts dynamically
  - Line 139: `const generatedPrompts = await promptGenerator.generatePrompts(3, 'symptoms');`
  - Generates diverse, realistic prompts for testing
  
- ✅ **Model 2 (gpt-oss:20b)**: Used to validate chatbot responses
  - Lines 56, 95, 126, 152, 184: `await responseValidator.validateResponse(...)`
  - Scores responses for quality, accuracy, completeness, safety

### ⚠️ Appointment Flow Tests (`appointment-flow.spec.js`)
**PARTIALLY USING OLLAMA:**
- ✅ **Model 2 (gpt-oss:20b)**: Used to validate responses
  - Line 85: `await responseValidator.validateResponse(...)`
  
- ❌ **Model 1 (llama2:latest)**: NOT used for prompt generation
  - Currently using hardcoded prompts: "Book Now", "General Checkup", etc.
  - Missing: Dynamic prompt generation for appointment scenarios

### ❌ UI Interaction Tests (`ui-interactions.spec.js`)
**NOT USING OLLAMA:**
- These are pure UI/UX tests
- No prompt generation or validation needed

## Summary

| Test File | Model 1 (Prompt Gen) | Model 2 (Validation) |
|-----------|---------------------|---------------------|
| response-quality.spec.js | ✅ YES | ✅ YES |
| appointment-flow.spec.js | ❌ NO | ✅ YES |
| ui-interactions.spec.js | ❌ NO | ❌ NO |

## Recommendation

Enhance `appointment-flow.spec.js` to also use Model 1 for generating diverse appointment prompts.
