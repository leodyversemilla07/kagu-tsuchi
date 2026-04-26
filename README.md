# Kagu-tsuchi 🔥

> **Multi-Agent AI Research Assistant** built with Next.js + NestJS

Kagu-tsuchi (Japanese fire god of creation) is a full-stack AI research assistant that uses a multi-agent architecture to analyze queries, search the web, and synthesize comprehensive reports with citations.

## ✨ Features

- **3-Agent Architecture**: Query Analyzer → Search Executor → Synthesizer
- **Real-time Streaming**: Server-Sent Events (SSE) for live agent progress
- **Memory System**: Remembers past searches for context-aware results
- **Optional LLM Synthesis**: OpenAI or Anthropic for enhanced reports
- **Input Validation**: class-validator + ValidationPipe
- **Modern UI**: Shadcn v4 with Lyra preset (boxy, sharp edges, dark mode)
- **Type-safe**: Full TypeScript integration across the stack
- **Monorepo**: Turborepo + pnpm workspaces for scalable development

## 🛠️ Tech Stack

### Frontend (`apps/web`)
- **Next.js** 16.1.6 (App Router)
- **React** 19.x
- **Tailwind CSS** 4.x
- **Shadcn/ui** v4 (Lyra preset)

### Backend (`apps/api`)
- **NestJS** 11.x
- **Exa API** for web search
- **OpenAI/Anthropic** (optional for LLM synthesis)

### Tooling
- **Biome** (Linting + Formatting)
- **Turborepo** 2.x (Build pipeline)
- **pnpm** 9.x (Package manager)
- **TypeScript** 5.x

## 📂 Project Structure

```
kagu-tsuchi/
├── apps/
│   ├── web/          # Next.js frontend
│   │   ├── app/      # App Router pages
│   │   └── components/ # Agent visualizer, UI
│   └── api/          # NestJS backend
│       └── src/
│           ├── agent1/    # Query Analyzer
│           ├── agent2/    # Search Executor
│           ├── agent3/    # Synthesizer
│           ├── search/    # Orchestration pipeline
│           └── memory/    # Conversation history
├── packages/
│   ├── ui/           # Shared Shadcn components
│   └── typescript-config/
├── .github/workflows/  # CI/CD
├── biome.json         # Biome config
├── pnpm-workspace.yaml
└── turbo.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 22.x
- pnpm 9.x
- Exa API key (for web search)
- OpenAI or Anthropic key (optional, for LLM synthesis)

### Installation

```bash
# Clone the repository
git clone https://github.com/leodyversemilla07/kagu-tsuchi.git
cd kagu-tsuchi

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env and add your EXA_API_KEY
```

### Development

```bash
# Start NestJS backend (Terminal 1)
cd apps/api
pnpm run start:dev

# Start Next.js frontend (Terminal 2)
cd apps/web
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) for frontend. API runs on port 3001.

## 🤖 Agent Architecture

### Agent 1: Query Analyzer
- **Input**: Raw user query
- **Output**: Structured search plan + follow-up questions
- **Logic**: Determines if query needs clarification

### Agent 2: Search Executor
- **Input**: Search plan from Agent1
- **Output**: Curated search results
- **Tech**: Exa API + authenticity evaluation

### Agent 3: Synthesizer
- **Input**: Curated results from Agent2 + memory context
- **Output**: Markdown report with citations
- **Optional**: OpenAI/Anthropic for enhanced synthesis

## 📡 API Endpoints

### NestJS Backend (Port 3001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search` | POST | Full orchestration (sync) |
| `/search/stream` | POST | Full orchestration (SSE streaming) |

### POST /search Request
```json
{
  "query": "What are the latest AI agent frameworks?",
  "maxSearches": 5,
  "deepThink": false
}
```

### POST /search Response
```json
{
  "queryAnalysis": { ... },
  "searchResults": { ... },
  "report": "...",
  "citations": [...],
  "memories": [...]
}
```

### POST /search/stream Response (SSE)
```
type: step
source: memory
data: Retrieving relevant memories...

type: data
source: agent1
data: {"queryAnalysis": {...}}

type: data  
source: agent2
data: {"searchResults": {...}}

type: done
source: agent3
data: {"report": "...", "citations": [...]}
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run unit tests
cd apps/api && pnpm test

# Run E2E tests
cd apps/api && pnpm test:e2e
```

**Test Coverage:**
- 22 unit tests (Agent1, Agent2, Agent3, SearchService)
- 3 E2E tests (validation, streaming)

## 🎨 UI Features

- **Search Bar**: Enter research queries
- **Agent Visualizer**: Real-time agent progress (Agent1 → Agent2 → Agent3)
- **Streaming Report**: Live markdown rendering with citations
- **Dark Mode**: Default Lyra preset theme
- **Responsive**: Works on desktop and mobile

## 🧹 Linting & Formatting

This project uses **Biome**:

```bash
# Check code
pnpm run lint

# Format code
pnpm run format
```

## 🚢 Deployment

### Frontend (Vercel)
```bash
# Connect GitHub repo to Vercel
# Auto-deploys on push to main
```

### Backend (Railway/Render)
```bash
# Deploy NestJS API to Railway or Render
# Set environment variables (EXA_API_KEY)
```

## 📊 Project Status

- [x] Phase 1-3: Project setup, architecture, environment
- [x] Phase 4: Agent1 (Query Analyzer)
- [x] Phase 5: Agent2 (Search Executor)
- [x] Phase 6: Agent3 (Synthesizer)
- [x] Phase 7: Agent orchestration pipeline
- [x] Phase 8: Next.js UI with agent visualizer
- [x] Phase 9: Memory system (in-memory store)
- [x] SSE streaming support
- [x] Input validation
- [x] CI/CD pipeline
- [x] Unit & E2E tests

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [Biome Documentation](https://biomejs.dev/)

## 👤 Author

**Leodyver S. Semilla**
- GitHub: [@leodyversemilla07](https://github.com/leodyversemilla07)
- Email: leodyversemilla07@gmail.com

## 📄 License

MIT License - feel free to use this project for learning or as a portfolio piece!

---

🔥 **Built with Next.js + NestJS + AI Agents**
