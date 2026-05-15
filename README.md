# NoteFlow ✦

A production-grade, collaborative AI-powered notes workspace. NoteFlow delivers a premium SaaS-level experience characterized by a "Glassmorphic 3D" visual identity, high-performance tech stack, and seamless real-time collaborative features.

## 📐 Architecture

```ascii
+--------------------+       +----------------------+       +-------------------+
|    Frontend (Web)  |       |    Backend (API)     |       |   Infrastructure  |
|  Next.js 14 App    |<----->|  NestJS Framework    |<----->|   PostgreSQL DB   |
|  Tailwind CSS v3   |       |  REST + Socket.io    |       |   Prisma ORM      |
|  Framer Motion     |       |  BullMQ Job Queue    |<----->|   Redis (Cache)   |
|  Three.js / R3F    |       +----------+-----------+       +-------------------+
|  Zustand + ReactQ  |                  |
+--------------------+                  v
                               +------------------+
                               | OpenRouter / GPT-5.2 |
                               |   (AI Service)   |
                               +------------------+
```

## 🛠️ Tech Stack

| Category        | Technology                                | Version      |
|-----------------|-------------------------------------------|--------------|
| **Frontend**    | React / Next.js                           | 18 / 14      |
| **Styling**     | Tailwind CSS                              | v3           |
| **Animations**  | Framer Motion / React Three Fiber         | Latest       |
| **Editor**      | TipTap                                    | Latest       |
| **State**       | Zustand (Client), React Query (Server)    | Latest       |
| **Backend**     | Node.js / NestJS                          | 10.x         |
| **Database**    | PostgreSQL / Prisma ORM                   | 15 / 5.x     |
| **Queue/Cache** | Redis / BullMQ                            | 7.x / 5.x    |
| **AI**          | OpenRouter (drop-in OpenAI compatible)    | Latest       |
| **Realtime**    | Socket.io                                 | Latest       |

## 🚀 Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd noteflow
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` in the root, `apps/api/.env`, and `apps/web/.env.local`
   ```bash
   cp .env.example .env
   cp .env.example apps/api/.env
   cp .env.example apps/web/.env.local
   ```
    *Make sure to provide your `OPENROUTER_API_KEY` in `.env`.*
   *For production, set `NODE_ENV=production` and configure `CORS_ORIGIN` to your web app domain(s), comma-separated if needed.*

3. **Start Infrastructure (PostgreSQL & Redis)**:
   ```bash
   docker-compose up -d
   ```

4. **Database Setup**:
   ```bash
   cd apps/api
   npx prisma migrate dev --name init
   ```

5. **Start Backend**:
   ```bash
   cd apps/api
   npm run start:dev
   ```

6. **Start Frontend**:
   ```bash
   cd apps/web
   npm run dev
   ```

7. **Open Browser**:
   Navigate to `http://localhost:3000`

## 📡 API Documentation

| Method | Endpoint                          | Description                               | Params / Body                     |
|--------|-----------------------------------|-------------------------------------------|-----------------------------------|
| POST   | `/api/auth/signup`                | Register a new user                       | `{ name, email, password }`       |
| POST   | `/api/auth/login`                 | Authenticate user                         | `{ email, password }`             |
| POST   | `/api/auth/refresh`               | Refresh JWT token                         | Headers: `Authorization` (Refresh)|
| GET    | `/api/auth/me`                    | Get current user                          | Auth Token                        |
| GET    | `/api/notes`                      | List user notes                           | `?search=&tag=&sort=&archive=`    |
| POST   | `/api/notes`                      | Create a new note                         | `{ title, content }`              |
| GET    | `/api/notes/:id`                  | Get note details                          | Note ID                           |
| PATCH  | `/api/notes/:id`                  | Update a note                             | `{ title, content, isArchived }`  |
| DELETE | `/api/notes/:id`                  | Delete a note                             | Note ID                           |
| POST   | `/api/notes/:id/archive`          | Archive a note                            | Note ID                           |
| POST   | `/api/notes/:id/restore`          | Restore an archived note                  | Note ID                           |
| POST   | `/api/notes/:id/generate-summary` | Generate AI summary (async)               | Note ID -> returns `{ jobId }`    |
| GET    | `/api/notes/:id/summary-status/:jobId` | SSE endpoint for AI generation stream | Note ID, Job ID               |
| POST   | `/api/notes/:id/share`            | Toggle public sharing                     | Note ID -> returns `{ shareId }`  |
| GET    | `/api/shared/:shareId`            | Get public note (no auth required)        | Share ID                          |
| GET    | `/api/tags`                       | List all tags                             | Auth Token                        |
| POST   | `/api/tags`                       | Create a tag                              | `{ name, color }`                 |
| GET    | `/api/insights/stats`             | Get aggregate usage stats                 | Auth Token                        |
| GET    | `/api/insights/weekly-activity`   | Get weekly activity data                  | Auth Token                        |

## 🎨 Design Decisions

*   **Next.js 14 App Router**: Chosen for its robust routing, server components for SEO (like shared public notes), and structured file system.
*   **Tailwind CSS + Custom Tokens**: Used for rapid styling, while completely overhauling the default theme to achieve the requested "Glassmorphic 3D Depth" look (deep navy, electric violet, aurora teal).
*   **Framer Motion & Three.js**: Crucial for delivering the "premium SaaS" feel. R3F powers the 3D orb hero and interactive charts, while Framer Motion handles page transitions and micro-interactions.
*   **TipTap**: A headless, highly customizable editor that allows us to build a unique Notion-like editing experience without fighting a predefined UI.
*   **Zustand + React Query**: Separation of concerns where server state (notes, summaries) is handled efficiently by React Query with optimistic updates, while local UI state is managed lightly by Zustand.
*   **NestJS + Prisma**: Provides a modular, scalable backend architecture with type safety end-to-end. Prisma makes DB interactions declarative and migrations a breeze.
*   **BullMQ**: Essential for offloading the slow Anthropic API calls to background workers, preventing HTTP blocking.
*   **Socket.io**: Powers the auto-saving mechanism and presence indicators, debounced for efficiency.

## 🤖 AI Integration

NoteFlow uses OpenRouter (OpenAI-compatible) for generating intelligent summaries, extracting action items, and suggesting titles.

Example backend call (POST `/api/ai`):

```json
{
   "model": "openai/gpt-5.2",
   "messages": [
      { "role": "user", "content": "Summarize this note and extract action items." }
   ]
}
```

The API expects `OPENROUTER_API_KEY` to be set in environment variables. Streaming behavior is supported by OpenRouter, but the current `/api/ai` endpoint uses non-streaming responses for simplicity.

Frontend example (TypeScript fetch) calling your backend proxy:

```ts
const res = await fetch('/api/ai', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
      model: 'openai/gpt-5.2',
      prompt: 'Summarize this note and extract action items.'
   }),
});
const json = await res.json();
console.log(json.content);
```

Sample AI JSON Output:
```json
{
  "summary": "This note covers the architectural planning for the NoteFlow application, highlighting the use of Next.js, NestJS, and an AI integration via Anthropic. It emphasizes the importance of a premium glassmorphic UI and async processing.",
  "action_items": [
    "Initialize monorepo structure with Next.js and NestJS",
    "Design database schema with Prisma",
    "Set up BullMQ worker for AI tasks"
  ],
  "suggested_title": "NoteFlow Architecture Planning",
  "key_topics": ["Architecture", "Tech Stack", "AI Integration", "UI/UX Design"]
}
```

## ⚠️ Known Limitations & Future Roadmap

*   **Real-time Collaboration**: Currently optimized for single-user cross-device synchronization. True multi-player editing (CRDTs via Yjs) would be the next step for shared notes.
*   **Full Text Search Engine**: Uses basic PostgreSQL text search. Could be enhanced with ElasticSearch or Typesense for typos and complex queries.
*   **More LLM Providers**: Add options for users to bring their own API keys or select different models (OpenAI, Gemini).

## ✅ CI, Deployment & PDF Test Report

This repository includes a GitHub Actions CI that runs API tests, builds the web app, generates an HTML test report, converts it to PDF, and uploads the PDF as an artifact.

To run locally:

```bash
# API
cd apps/api
npm install
npm test -- --json --outputFile=../../artifacts/api-test.json

# Web
cd ../web
npm install
npm run build

# Generate report (node >= 18 required)
node .github/scripts/generate-test-report.js
# Convert to PDF (install wkhtmltopdf locally):
wkhtmltopdf artifacts/report.html artifacts/report.pdf
```

Deploying to Vercel

1. In Vercel, create a new project and point it to this monorepo; set the root to `apps/web`.
2. Add environment variables in Vercel dashboard:
   - `OPENROUTER_API_KEY` — your OpenRouter (OpenAI-compatible) API key.
   - `OPENROUTER_MODEL` — optional model (e.g. `openai/gpt-5.2`).
3. The included `vercel.json` helps Vercel detect the Next.js app inside `apps/web`.

Preparing a branch & PR

I created local edits in this workspace. To push them and open a PR, run:

```bash
git checkout -b feat/ui-mobile-ai
git add -A
git commit -m "UX: mobile sidebar, AI assistant modal, CI report + vercel config"
git push origin feat/ui-mobile-ai
# Then open a Pull Request on GitHub (or I can open one if you give me access).
```

