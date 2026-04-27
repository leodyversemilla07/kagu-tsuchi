# OpenRouter Setup for Kagu-tsuchi

## ✅ Changes Made

The following modifications were made to support OpenRouter free models:

### 1. Updated `apps/api/src/agent3/agent3.service.ts`
- Added `createOpenAI` import from `@ai-sdk/openai`
- Added OpenRouter as a supported provider (`openrouter`)
- Configured OpenRouter API endpoint (`https://openrouter.ai/api/v1`)
- Added support for `OPENROUTER_API_KEY` and `OPENROUTER_SYNTHESIS_MODEL` env vars

### 2. Updated `apps/api/.env.example`
- Added OpenRouter configuration options
- Listed available free models

### 3. Created `apps/api/.env`
- Pre-configured for OpenRouter with `tencent/hy3-preview:free` model

## 🚀 How to Get It Working

### Step 1: Get API Keys

1. **OpenRouter API Key** (free):
   - Sign up at https://openrouter.ai
   - Go to https://openrouter.ai/keys
   - Create a new API key (free tier available)

2. **Exa API Key** (required for web search):
   - Sign up at https://exa.ai
   - Get your API key from the dashboard
   - Free tier includes 1000 searches/month

### Step 2: Configure Environment

Edit `apps/api/.env` and add your keys:

```bash
# Required
EXA_API_KEY=exa_your_actual_key_here

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your_actual_key_here
OPENROUTER_SYNTHESIS_MODEL=tencent/hy3-preview:free
```

### Step 3: Install Dependencies (if not done)

```bash
cd /home/ubuntu/workspace/kagu-tsuchi
pnpm install
```

### Step 4: Start the Application

Terminal 1 - Start the NestJS API:
```bash
cd apps/api
pnpm run start:dev
```

Terminal 2 - Start the Next.js frontend:
```bash
cd apps/web
pnpm run dev
```

### Step 5: Use the App

Open http://localhost:3000 in your browser and start researching!

## 🆓 Free Models Available on OpenRouter

You can change the `OPENROUTER_SYNTHESIS_MODEL` in `.env` to any of these free models:

- `tencent/hy3-preview:free` (default - pi's default free model)
- `google/gemma-3-1b-it:free` (fast, lightweight)
- `meta-llama/llama-3.1-8b-instruct:free` (more capable)
- `deepseek/deepseek-chat:free` (good for research)
- `qwen/qwen-2-7b-instruct:free` (Alibaba's model)
- `mistralai/mistral-7b-instruct:free` (Mistral's model)

See full list at: https://openrouter.ai/models?order=newest&supported_parameters=tools&max_price=0

## 🔍 How It Works

1. **Agent 1 (Query Analyzer)**: Breaks down your query into search terms
2. **Agent 2 (Search Executor)**: Uses Exa API to search the web
3. **Agent 3 (Synthesizer)**: Uses OpenRouter (with free models) to generate a comprehensive report with citations

## 🛠️ Troubleshooting

- **Build errors**: Run `pnpm install` in the root directory
- **API connection issues**: Ensure ports 3000 and 3001 are available
- **OpenRouter errors**: Verify your API key and model name
- **Exa search fails**: Verify your Exa API key has remaining credits

## 📝 Notes

- The app works without an LLM (will use deterministic synthesis), but using OpenRouter gives much better reports
- Free models on OpenRouter have rate limits but are suitable for personal use
- You can switch providers anytime by changing `SYNTHESIS_PROVIDER` in `.env`
