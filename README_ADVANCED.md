# Advanced Features Guide

## 🚀 New Advanced Features

### 1. Multi-Turn Conversation Testing
Test complete conversation flows, not just single prompts:

```javascript
const conversation = await conversationGenerator.generateConversation('symptoms', 3);
// Tests: ["I have a headache", "It started yesterday", "The pain is moderate"]
```

### 2. Edge Case Generation
Automatically test edge cases:

```javascript
const edgeCases = conversationGenerator.generateEdgeCases();
// Tests: empty, very long, special chars, emojis, SQL injection, XSS, etc.
```

### 3. Semantic Similarity Validation
Compare responses using embeddings:

```javascript
const similarity = await semanticValidator.compareResponses(response1, response2);
// Returns: 0.85 (85% similar)
```

### 4. Performance Benchmarking
Track and detect performance regressions:

```javascript
performanceBenchmark.record(responseTime, 'test-name');
const check = performanceBenchmark.checkPerformance(5000, 10000);
```

### 5. Regression Testing with Baselines
Compare responses against known good baselines:

```javascript
baselineManager.saveBaseline(testId, prompt, response);
const comparison = await baselineManager.compareWithBaseline(testId, currentResponse);
```

### 6. Advanced Analytics Dashboard
Interactive HTML dashboards with charts:

```bash
npm run dashboard
# Opens: reports/dashboards/dashboard-*.html
```

## Running Advanced Tests

```bash
# Run all advanced feature tests
npm run test:advanced

# Run specific test
npx playwright test tests/e2e/advanced-features.spec.js --grep "multi-turn"
```

## Benefits

✅ **More Realistic Testing**: Multi-turn conversations
✅ **Better Coverage**: Automatic edge case testing
✅ **Accurate Validation**: Semantic similarity
✅ **Performance Monitoring**: Track regressions
✅ **Visual Insights**: Interactive dashboards
