# LLM Testing Framework

AI-powered testing framework for Healthcare Chatbot using Playwright and Ollama.

## Architecture

This framework uses a **two-model approach**:

1. **Model 1 (`llama2:latest`)**: Generates diverse test prompts
2. **Model 2 (`gpt-oss:20b`)**: Validates chatbot response quality

## Features

### Core Features
- 🤖 **AI-Powered Test Generation**: Automatically creates realistic test scenarios
- ✅ **Response Quality Validation**: Evaluates chatbot responses using LLM
- 🎭 **UI/UX Testing**: Comprehensive browser automation with Playwright
- 📊 **Detailed Reporting**: HTML reports with quality scores and metrics
- 🔄 **End-to-End Testing**: Full conversation flow testing

### Advanced AI/LLM Testing Features
- 🧠 **Hallucination Detection**: Detects false or unsupported medical information
- ✅ **Fact-Checking**: Validates medical facts against knowledge base
- 🔄 **Consistency Testing**: Ensures consistent responses to same questions
- 🛡️ **Toxicity & Bias Detection**: Detects toxic, biased, or inappropriate content
- 🔒 **Adversarial Testing**: Tests resilience against adversarial inputs
- 🚨 **Prompt Injection Testing**: Security testing for prompt injection vulnerabilities

## Prerequisites

### 1. System Requirements
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning repositories)

### 2. Healthcare Chatbot Setup (Required)

**IMPORTANT**: The Healthcare Chatbot must be set up and running before running these tests.

#### Step 1: Navigate to Healthcare Chatbot Directory
```bash
cd /Users/anjali/Desktop/CreateChatbots
# Or wherever your Healthcare Chatbot project is located
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Configure Environment Variables
Create a `.env` file in the Healthcare Chatbot directory:
```bash
# Optional: For AI-enhanced responses
OPENAI_API_KEY=your_openai_api_key_here

# Server configuration
PORT=3000
```

#### Step 4: Initialize Database
The database will be created automatically on first run, but you can verify:
```bash
# Database will be created at: data/chatbot.db
```

#### Step 5: Start the Healthcare Chatbot Server
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

**Verify it's running**: Open `http://localhost:3000` in your browser. You should see the chatbot interface.

**Keep this server running** in a separate terminal window while running tests.

### 3. Ollama Setup (Required)

#### Step 1: Install Ollama
Visit [https://ollama.ai](https://ollama.ai) and download Ollama for your operating system.

**macOS**:
```bash
# Using Homebrew
brew install ollama

# Or download from: https://ollama.ai/download
```

**Linux**:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows**: Download installer from [ollama.ai](https://ollama.ai)

#### Step 2: Start Ollama Service
```bash
ollama serve
```

**Verify it's running**: 
```bash
curl http://localhost:11434/api/tags
# Should return JSON with available models
```

**Keep Ollama running** in a separate terminal window.

#### Step 3: Pull Required Models
```bash
# Model 1: For prompt generation (creates test prompts)
ollama pull llama2:latest

# Model 2: For response validation (validates chatbot responses)
ollama pull gpt-oss:20b

# Alternative if gpt-oss:20b is not available, you can use:
# ollama pull llama2:latest  # Use same model for both
```

**Verify models are installed**:
```bash
ollama list
# Should show llama2:latest and gpt-oss:20b (or your chosen models)
```

### 4. LLM Testing Framework Setup

#### Step 1: Navigate to Testing Framework Directory
```bash
cd /Users/anjali/Desktop/LLM-Testing-Framework
# Or wherever your LLM Testing Framework project is located
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Install Playwright Browsers
```bash
npx playwright install
# Or use the npm script:
npm run install-browsers
```

#### Step 4: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` file:
```bash
# Ollama configuration
OLLAMA_URL=http://localhost:11434

# Healthcare Chatbot URL
CHATBOT_URL=http://localhost:3000

# Validation thresholds (optional)
MIN_QUALITY_SCORE=0.7
SIMILARITY_THRESHOLD=0.75
```

#### Step 5: Verify Configuration
```bash
# Check if Healthcare Chatbot is running
curl http://localhost:3000

# Check if Ollama is running
curl http://localhost:11434/api/tags

# Both should return responses (not errors)
```

## Installation Summary

**Quick Setup Checklist**:
- [ ] Node.js installed (v16+)
- [ ] Healthcare Chatbot project set up
- [ ] Healthcare Chatbot running on `http://localhost:3000`
- [ ] Ollama installed and running
- [ ] Ollama models pulled (`llama2:latest` and `gpt-oss:20b`)
- [ ] LLM Testing Framework dependencies installed
- [ ] Playwright browsers installed
- [ ] `.env` file configured
- [ ] Both services verified and running

## Running Tests

### Before Running Tests

**Ensure both services are running**:
1. Healthcare Chatbot: `http://localhost:3000` ✅
2. Ollama: `http://localhost:11434` ✅

You can verify with:
```bash
# Check Healthcare Chatbot
curl http://localhost:3000

# Check Ollama
curl http://localhost:11434/api/tags
```

### Test Commands

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:response-quality      # Response quality validation
npm run test:appointment            # Appointment flow testing
npm run test:ui-interactions        # UI/UX testing
npm run test:advanced               # Advanced features (multi-turn, edge cases)
npm run test:advanced-ai           # Advanced AI/LLM testing (hallucination, fact-check, etc.)

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode
npm run test:debug
```

### First Time Running Tests

**Recommended order for first-time setup**:
```bash
# 1. Quick UI test to verify everything works
npm run test:ui-interactions

# 2. Test response quality
npm run test:response-quality

# 3. Test appointment flow
npm run test:appointment

# 4. Test advanced features
npm run test:advanced

# 5. Test advanced AI/LLM features (takes longer)
npm run test:advanced-ai
```

### Troubleshooting

**If tests fail to connect**:
- Verify Healthcare Chatbot is running: `curl http://localhost:3000`
- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- Check `.env` file has correct URLs

**If Ollama models are not found**:
- Run: `ollama list` to see installed models
- Pull missing models: `ollama pull llama2:latest`
- Update `config/ollama.config.js` if using different models

**If tests timeout**:
- LLM responses can take 30-60 seconds
- Increase timeout in `playwright.config.js` if needed
- Check Ollama is not overloaded (restart if needed)

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
- No hallucinations detected (Critical/High severity)
- Fact-checking accuracy > 0.5 (50%)
- Consistency similarity > 0.75 (75%)
- No toxicity or bias detected
- Security score > 0.8 (80%) for prompt injection resistance

## Complete Setup Workflow

### Step-by-Step Setup (First Time)

1. **Set up Healthcare Chatbot** (if not already done):
   ```bash
   cd /Users/anjali/Desktop/CreateChatbots
   npm install
   # Create .env file with OPENAI_API_KEY (optional)
   npm start
   # Verify: http://localhost:3000
   ```

2. **Set up Ollama**:
   ```bash
   # Install Ollama (if not installed)
   # macOS: brew install ollama
   # Or download from https://ollama.ai
   
   # Start Ollama
   ollama serve
   
   # Pull models
   ollama pull llama2:latest
   ollama pull gpt-oss:20b
   ```

3. **Set up LLM Testing Framework**:
   ```bash
   cd /Users/anjali/Desktop/LLM-Testing-Framework
   npm install
   npx playwright install
   cp .env.example .env
   # Edit .env with correct URLs
   ```

4. **Verify Everything Works**:
   ```bash
   # Terminal 1: Healthcare Chatbot
   cd /Users/anjali/Desktop/CreateChatbots
   npm start
   
   # Terminal 2: Ollama
   ollama serve
   
   # Terminal 3: Run Tests
   cd /Users/anjali/Desktop/LLM-Testing-Framework
   npm run test:ui-interactions
   ```

## See Also

- [Project Architecture](PROJECT_ARCHITECTURE.md) - Detailed architecture explanation
- [Advanced AI Testing](ADVANCED_AI_TESTING.md) - Advanced testing features guide
- [Complete Project Guide](COMPLETE_PROJECT_CREATION_GUIDE.md) - Full project creation steps
- [Healthcare Chatbot](../CreateChatbots/README.md) - Healthcare Chatbot documentation
