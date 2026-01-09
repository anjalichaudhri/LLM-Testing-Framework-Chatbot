/**
 * Quick Test Script
 * Tests basic functionality without running full Playwright suite
 */

const ollamaClient = require('./src/ollama/ollama-client');
const promptGenerator = require('./src/ollama/prompt-generator');
const responseValidator = require('./src/ollama/response-validator');
const axios = require('axios');

async function quickTest() {
  console.log('🧪 Running Quick Test...\n');

  // Test 1: Ollama Connection
  console.log('1️⃣ Testing Ollama connection...');
  const isAvailable = await ollamaClient.isAvailable();
  if (!isAvailable) {
    console.log('❌ Ollama is not available. Please start Ollama.');
    return;
  }
  console.log('✅ Ollama is available\n');

  // Test 2: Models Available
  console.log('2️⃣ Checking models...');
  const hasLlama = await ollamaClient.hasModel('llama2:latest');
  const hasGpt = await ollamaClient.hasModel('gpt-oss:20b');
  console.log(`   llama2:latest: ${hasLlama ? '✅' : '❌'}`);
  console.log(`   gpt-oss:20b: ${hasGpt ? '✅' : '❌'}\n`);

  if (!hasLlama || !hasGpt) {
    console.log('❌ Required models not available');
    return;
  }

  // Test 3: Healthcare Chatbot
  console.log('3️⃣ Testing Healthcare Chatbot connection...');
  try {
    const response = await axios.get('http://localhost:3000', { timeout: 5000 });
    console.log('✅ Healthcare Chatbot is running\n');
  } catch (error) {
    console.log('❌ Healthcare Chatbot is not running. Please start it first.\n');
    return;
  }

  // Test 4: Prompt Generation
  console.log('4️⃣ Testing prompt generation (Model 1)...');
  try {
    const prompt = await promptGenerator.generatePrompt('symptoms');
    console.log(`✅ Generated prompt: "${prompt}"\n`);
  } catch (error) {
    console.log(`❌ Prompt generation failed: ${error.message}\n`);
  }

  // Test 5: Response Validation
  console.log('5️⃣ Testing response validation (Model 2)...');
  try {
    const testResponse = "Headaches can be caused by various factors including stress, dehydration, or underlying medical conditions. It's important to stay hydrated and rest. If the headache persists or is severe, please consult with a healthcare professional. For emergencies, call 911.";
    const validation = await responseValidator.validateResponse(
      'I have a headache',
      testResponse,
      'symptoms'
    );
    console.log(`✅ Validation score: ${(validation.score * 100).toFixed(1)}%`);
    console.log(`   Passed: ${validation.passed ? '✅' : '❌'}\n`);
  } catch (error) {
    console.log(`❌ Validation failed: ${error.message}\n`);
  }

  // Test 6: Chatbot API
  console.log('6️⃣ Testing chatbot API...');
  try {
    const apiResponse = await axios.post(
      'http://localhost:3000/api/chat',
      { message: 'Hello' },
      { timeout: 10000 }
    );
    if (apiResponse.data && apiResponse.data.response) {
      console.log(`✅ Chatbot responded: "${apiResponse.data.response.substring(0, 50)}..."\n`);
    } else {
      console.log('❌ Invalid API response\n');
    }
  } catch (error) {
    console.log(`❌ API test failed: ${error.message}\n`);
  }

  console.log('✨ Quick test completed!');
  console.log('\n📝 Next steps:');
  console.log('   - Run full tests: npm test');
  console.log('   - Run specific suite: npm run test:response-quality');
}

quickTest().catch(console.error);
