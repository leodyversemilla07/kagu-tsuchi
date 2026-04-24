# Kagu-tsuchi 🔥

> **Multi-Agent AI Research Assistant** built with Next.js + NestJS

Kagu-tsuchi (Japanese fire god of creation) is a full-stack AI research assistant that uses a multi-agent architecture to analyze queries, search the web, and synthesize comprehensive reports with citations.

## ✨ Features

- **3-Agent Architecture**: Query Analyzer → Search Executor → Synthesizer
- **Real-time Streaming**: Server-Sent Events (SSE) for live agent progress
- **Memory System**: Remembers past searches for context-aware results
- **Modern UI**: Shadcn v4 with Lyra preset (boxy, sharp edges, dark mode)
- **Type-safe**: Full TypeScript integration across the stack
- **Monorepo**: Turborepo + pnpm workspaces for scalable development

## 🛠️ Tech Stack

### Frontend (`apps/web`)
- **Next.js** 16.1.6 (App Router)
- **React** 19.2.4
- **Vercel AI SDK** for streaming responses
- **Shadcn/ui** v4 (Lyra preset)
- **Tailwind CSS** 4.x

### Backend (`apps/api`)
- **NestJS** 11.0.1
- **Node.js** 20.x
- **Exa API** for web search
- **In-Memory Vector Store** (upgradeable to Pinecone)

### Tooling
- **Biome** v2.4.13 (Linting + Formatting)
- **Turborepo** 2.x (Build pipeline)
- **pnpm** 8.x (Package manager)
- **TypeScript** 5.7/5.9

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
│           ├── search/    # Orchestration pipeline
│           └── memory/    # Conversation history
├── packages/
│   ├── ui/           # Shared Shadcn components
│   └── typescript-config/
├── biome.json         # Biome config (replaces ESLint/Prettier)
├── pnpm-workspace.yaml
└── turbo.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x
- pnpm 8.x
- Exa API key (for web search)

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

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🤖 Agent Architecture

### Agent 1: Query Analyzer
- **Input**: Raw user query
- **Output**: Structured search plan + follow-up questions
- **Tech**: LLM function calling (OpenAI/Claude)

### Agent 2: Search Executor
- **Input**: Search plan from Agent1
- **Output**: Curated search results + deep think decision
- **Tech**: Exa API + LLM evaluation + Memory context

### Agent 3: Synthesizer
- **Input**: Curated results from Agent2
- **Output**: Markdown report with citations + optional charts
- **Tech**: Vercel AI SDK streaming

## 📡 API Endpoints

### NestJS Backend (Port 3001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agent1/analyze` | POST | Query Analyzer (Agent1) |
| `/agent2/search` | POST | Search Executor (Agent2) |
| `/search` | POST | Full orchestration pipeline (SSE stream) |

### POST /search Request
```json
{
  "query": "What are the latest AI agent frameworks?",
  "options": {
    "deepThink": true,
    "maxResults": 10
  }
}
```

### POST /search Response (SSE Stream)
```
event: agent_status
data: {"agent": "agent1", "status": "processing"}

event: follow_up
data: {"questions": ["Specific area?", "Timeline?"]}

event: agent_status
data: {"agent": "agent2", "status": "searching"}

event: final_result
data: {"report": "...", "citations": [...]}
```

## 🎨 UI Features

- **Search Bar**: Enter research queries
- **Agent Visualizer**: Real-time agent progress (Agent1 → Agent2 → Agent3)
- **Streaming Report**: Live markdown rendering with citations
- **Dark Mode**: Default Lyra preset theme
- **Responsive**: Works on desktop and mobile

## 🧹 Linting & Formatting

This project uses **Biome** (replacing ESLint + Prettier):

```bash
# Check code
pnpm run lint

# Format code
pnpm run format

# Fix issues
pnpm dlx biome check --apply
```

## 📦 Adding Components

To add Shadcn components:

```bash
# From root directory
pnpm dlx shadcn@latest add [component] --cwd apps/web

# Components are stored in packages/ui/src/components/
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
- [ ] Phase 10: Deploy to Vercel + Railway + Case study

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Biome Documentation](https://biomejs.dev/)

## 👤 Author

**Leodyver S. Semilla**
- GitHub: [@leodyversemilla07](https://github.com/leodyversemilla07)
- Email: leodyversemilla07@gmail.com
- Website: [leodyver.me](https://leodyver.me)

## 📄 License

MIT License - feel free to use this project for learning or as a portfolio piece!

---

🔥 **Built with Next.js + NestJS + AI Agents**
