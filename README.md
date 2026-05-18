# NoteFlow ✦

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel%20Live-brightgreen?style=for-the-badge&logo=vercel)](https://ai-note-app-taupe.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js%2014%20%7C%20NestJS-blue?style=for-the-badge&logo=nextdotjs)](https://github.com/abhinavsai2006/AI-Note-App)
[![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](https://opensource.org/licenses/MIT)

NoteFlow is a production-grade, collaborative AI-powered notes workspace. Engineered with a premium **Glassmorphic 3D** visual identity and powered by a highly optimized serverless monorepo stack, NoteFlow delivers seamless performance, real-time cross-device synchronization, and instant deep AI cognitive processing.

---

## 🎨 Core Features & Highlights

*   **✨ Intelligent Cognitive Summarization**: Generate instant, highly accurate AI summaries, automated action items, and context-aware titles.
*   **🌐 Instant Public Publishing**: Share clean, read-only notes via custom shareable portals resolving dynamically to your client host.
*   **⚡ Premium 3D Glassmorphic Interface**: Fully responsive, high-performance UI styled with curated modern design palettes, fluid micro-interactions, and premium glass textures.
*   **🔄 Robust Client-Side Synchronization**: Engineered with type-safe backend-backed state storage combined with client-side local caching.

---

## 📐 Architecture & System Flow

```ascii
+--------------------+       +----------------------+       +-------------------+
|    Frontend (Web)  |       |    Backend (API)     |       |   Infrastructure  |
|  Next.js 14 App    |<------>|  NestJS Framework    |<------>|   PostgreSQL DB   |
|  Tailwind CSS v3   |       |  REST + JWT Auth     |       |   Prisma ORM      |
|  Lucide Icons      |       |  Modular Services    |       |   Hosted Database |
|  Zustand + ReactQ  |       +----------+-----------+       +-------------------+
+--------------------+                  |
                                        v
                               +------------------+
                               |    OpenRouter    |
                               |  (Gemini / GPT)  |
                               +------------------+
```

---

## 🛠️ State-of-the-Art Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router) | React framework optimized for dynamic routing, SEO, and static generation. |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) | Curated visual theme customized with smooth glassmorphism utilities. |
| **Icons** | [Lucide React](https://lucide.dev/) | Premium, lightweight vector micro-icons. |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) | Ultra-lightweight, high-performance global store for client-side persistence. |
| **Backend** | [NestJS](https://nestjs.com/) | Production-grade Node.js framework offering enterprise-grade modular architecture. |
| **ORM** | [Prisma](https://www.prisma.io/) | Next-generation declarative ORM with full end-to-end type safety. |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Highly scalable relational database storage. |
| **AI Processing** | [OpenRouter AI](https://openrouter.ai/) | High-speed LLM gateway for intelligent text completion and notes summarization. |

---

## 🚀 Setup & Local Execution

Follow these steps to deploy and run NoteFlow locally:

### 1. Clone the Repository
```bash
git clone https://github.com/abhinavsai2006/AI-Note-App.git
cd AI-Note-App
```

### 2. Configure Environment Variables
Create a local environment configuration file by copying `.env.example` in the root:
```bash
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```
> [!NOTE]
> Make sure to configure your database connection string under `DATABASE_URL` and supply your `OPENROUTER_API_KEY` for AI features.

### 3. Deploy Local Services
Deploy the PostgreSQL container instance:
```bash
docker-compose up -d
```

### 4. Database Migrations
Initialize your database schema using Prisma:
```bash
cd apps/api
npx prisma migrate dev --name init
```

### 5. Launch the Monorepo
*   **Run Backend:** `npm run start:dev` (inside `apps/api`)
*   **Run Frontend:** `npm run dev` (inside `apps/web`)

Open your browser and navigate to **`http://localhost:3000`** to access your workspace.

---

## 📡 API Reference

| Endpoint | Method | Description | Request Payload / Params |
| :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Register a new workspace account | `{ name, email, password }` |
| `/api/auth/login` | `POST` | Authenticate and obtain JWT token | `{ email, password }` |
| `/api/notes` | `GET` | Retrieve list of user notes | `Headers: { Authorization: Bearer <Token> }` |
| `/api/notes` | `POST` | Create a new blank note | `{ title, content }` |
| `/api/notes/:id` | `PATCH` | Update note title and content | `{ title, content }` |
| `/api/notes/:id/archive` | `POST` | Toggle archive status of a note | Note ID parameter |
| `/api/notes/:id/generate-summary`| `POST` | Generate AI summary and key items | Note ID parameter |
| `/api/notes/:id/share` | `POST` | Enable/Disable public sharing link | Note ID parameter |
| `/api/shared/:shareId` | `GET` | Access read-only shared note | Share ID parameter (Public) |

---

## 🤖 Deep AI Integration

NoteFlow natively integrates with OpenRouter for highly performant, server-side content extraction. 

### AI Generation Request Payload
```json
{
  "model": "google/gemini-2.5-pro",
  "messages": [
    {
      "role": "user",
      "content": "Analyze this note content. Return valid JSON with: summary (string), action_items (array of strings), suggested_title (string)."
    }
  ]
}
```

### AI Structured Output JSON
```json
{
  "summary": "This note covers the architectural planning for the NoteFlow application, highlighting the use of Next.js, NestJS, and an AI integration.",
  "action_items": [
    "Initialize monorepo structure with Next.js and NestJS",
    "Design database schema with Prisma",
    "Configure client-side router fallback parameters"
  ],
  "suggested_title": "NoteFlow Architectural Planning"
}
```

---

## 🔮 Strategic Future Roadmap

*   **Multiplayer Real-time Collaboration**: Incorporate Yjs / CRDT algorithms combined with WebSockets for instantaneous collaborative document editing.
*   **Vector Search Integration**: Implement pgvector or Pinecone to provide fast semantic search queries and similarity matching across user notes.
*   **Client Key Injection**: Allow professional users to configure custom OpenAI, Gemini, or Anthropic API keys directly inside the workspace settings interface.

---

## 📈 Quality Assurance & CI/CD Pipelines

This codebase features automated test pipelines configured via GitHub Actions.

To execute tests and verify type systems locally:
```bash
# Run API Integration tests
cd apps/api
npm install
npm run test

# Compile Frontend Web Bundle
cd ../web
npm install
npm run build
```

---

## 📦 Production Deployment

The monorepo is fully optimized for cloud execution on **Vercel**:
1. Create a project pointing to your repository, setting the root directory to `apps/web`.
2. Configure environment variables (`OPENROUTER_API_KEY`, `JWT_SECRET`, `DATABASE_URL`).
3. Vercel automatically deploys both serverless Next.js pages and edge-ready API endpoints using the configuration defined in `apps/web/vercel.json`.

*   **Production Deployment URL:** [https://ai-note-app-taupe.vercel.app](https://ai-note-app-taupe.vercel.app)
