# NoteFlow AI: Production Deployment Plan & Checklist

This document details the architectural fixes, configuration updates, and verification protocols implemented to make the **NoteFlow (Collaborative AI Notes)** monorepo fully ready for a robust, high-performance production deployment on **Vercel** and **Neon PostgreSQL**.

---

## 🗺️ System Architecture & Request Lifecycle

Below is the request lifecycle diagram showing how client requests are securely routed, proxied to bypass CORS restrictions, and handled with serverless resilience:

```mermaid
graph TD
    Client[Client Browser] -->|1. Request /api/proxy/notes| FE_Proxy[Frontend Next.js App<br>apps/web]
    FE_Proxy -->|2. Proxy Fetch| BE_Lambda[Backend NestJS Lambda<br>apps/api]
    
    subgraph Vercel Serverless
        BE_Lambda -->|3. Route /api/notes| NestJS[NestJS Engine]
        NestJS -->|4. Global Timeout Interceptor<br>Enforce 15s limit| Controller[NotesController]
        Controller -->|5. SQL Query<br>Timeout Protection| Prisma[Prisma Service Singleton]
    end
    
    Prisma -->|6a. Attempt TCP Connect| NeonPool[Neon Postgres Connection Pooler<br>pgbouncer=true&connect_timeout=3]
    NeonPool -->|7a. SQL Result| Prisma
    
    Prisma -.->|6b. DB Down / Timeout Fallback| FileStore[Local Read-Only Fallback Store<br>resilience/cached-store]
    FileStore -.->|7b. Cached Data| Prisma
    
    Prisma -->|8. Formatted Record| Controller
    Controller -->|9. JSON Response| BE_Lambda
    BE_Lambda -->|10. Proxied JSON| Client
```

---

## 🛠️ Summary of Structural Updates

We have hardened the entire codebase against standard serverless gotchas, connection leaks, and routing mismatches:

| File Affected | Type of Fix | Implementation Details & Rationale |
| :--- | :--- | :--- |
| **`apps/api/vercel.json`** | **Routing & Compilation** | Replaced default zero-config mapping with explicit `"builds"` and `"routes"` targeting `api/[[...all]].ts` using `@vercel/node`. This permanently fixes the `Invalid export found in module "src/main.js"` error by stopping Vercel from treating helper scripts as standalone serverless entrypoints. Removed duplicate static CORS headers to let NestJS handle preflight requests dynamically. |
| **`apps/api/src/common/interceptors/timeout.interceptor.ts`** | **Request Timeout Protection** | Created a global NestJS Interceptor using RxJS to enforce a strict `15,000ms` request timeout. Returns a clean `408 Request Timeout` JSON error instead of letting Vercel timeout with a generic `504 Gateway Error`. |
| **`apps/api/src/main.ts`** | **CORS & Interceptor Registration** | Registered the global `TimeoutInterceptor` in NestJS. Updated `enableCors` to explicitly allow the `OPTIONS` method to natively handle preflight headers securely for local development, staging, and production domains. |
| **`apps/api/src/notes/notes.service.ts`** | **Database Resilience Fallback** | Extended the file-based fallback pattern to the `generateSummary` method. If PostgreSQL goes down or a query times out, AI summaries are saved to the cache rather than throwing a blocking 500 error. |
| **`apps/api/package.json`** | **Environment Independence** | Changed the Prisma build-step hooks from `prisma generate` to `npx prisma generate` to guarantee local and Vercel container builds resolve dependencies correctly using the lockfile. |
| **`.env.example`** | **Documentation** | Redesigned the configuration template with direct vs pooled Neon connection guidelines, timeout configurations, and detailed explanations of all environment parameters. |

---

## 🔑 Environment Variables Mapping

For the monorepo deployment, you must configure two separate projects in your Vercel Dashboard. Supply the following environment variables exactly as specified:

### 1. Backend Vercel Project (Project Name: `api`)
* **Framework Preset**: `Other`
* **Root Directory**: `apps/api`

| Variable Key | Suggested Production Value | Description |
| :--- | :--- | :--- |
| **`DATABASE_URL`** | `postgresql://[user]:[password]@[host]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require&pgbouncer=true&connect_timeout=3&connection_limit=1` | **Pooled Connection String** (Neon connection string with `-pooler` in the host). **CRITICAL**: Include `pgbouncer=true`, `connect_timeout=3`, and `connection_limit=1` to prevent serverless Lambda cold starts from exhausting database connection limits! |
| **`DIRECT_URL`** | `postgresql://[user]:[password]@[host].[region].aws.neon.tech/[dbname]?sslmode=require` | **Direct Connection String** (No `-pooler` in host). Used solely by Prisma CLI for migrations and schema applications. |
| **`JWT_SECRET`** | *[Generates secure string]* | Minimum 32-character random string (e.g., `openssl rand -base64 32`). |
| **`JWT_EXPIRATION`** | `7d` | Tokens expire in 7 days. |
| **`CORS_ORIGIN`** | `https://ai-note-app-taupe.vercel.app,https://web-beta-rouge-77.vercel.app` | Comma-separated list of allowed production frontend domains. Do NOT put a trailing slash. |
| **`OPENROUTER_API_KEY`** | *[Your OpenRouter API Key]* | Required for AI summaries. If omitted, the backend falls back to an offline local summary generator. |
| **`OPENROUTER_MODEL`** | `openrouter/auto` | Model choice for summary generation. |
| **`REQUEST_TIMEOUT_MS`** | `15000` | Limits execution duration of all API requests to 15 seconds to preempt Vercel timeouts. |
| **`NODE_ENV`** | `production` | Enables performance optimizations and secures error payloads. |

### 2. Frontend Vercel Project (Project Name: `ai-note-app`)
* **Framework Preset**: `Next.js`
* **Root Directory**: `apps/web`

| Variable Key | Suggested Production Value | Description |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_API_URL`** | `https://api-snowy-rho-50.vercel.app` | The production URL of your backend Vercel deployment (the URL generated by the `api` project). |

---

## 🚀 Step-by-Step Vercel Deployment Checklist

To deploy the production-ready applications, execute the following steps:

### Phase 1: Database Migration
Before redeploying the backend, execute the migrations directly to your Neon PostgreSQL instance from your local console using the direct database connection url:
```bash
# In your terminal, temporarily set your DIRECT_URL in your environment:
$env:DATABASE_URL="postgresql://user:password@ep-cool-123456.us-east-2.aws.neon.tech/noteflow?sslmode=require"

# Inside apps/api, apply migrations to Neon:
cd apps/api
npx prisma migrate deploy
```

### Phase 2: Deploying the Backend API
1. Navigate to the Vercel Dashboard, select the **`api`** project (or create a new project with root directory set to `apps/api`).
2. Go to **Settings -> Environment Variables** and add all variables in the Backend table above (ensuring the `sslmode=require&pgbouncer=true&connect_timeout=3&connection_limit=1` is applied to `DATABASE_URL`).
3. Deploy the backend from your local monorepo root:
   ```bash
   cd apps/api
   vercel --prod
   ```
4. Note down the deployed API URL (e.g., `https://api-snowy-rho-50.vercel.app`).

### Phase 3: Deploying the Frontend Web App
1. Navigate to the Vercel Dashboard, select the **`ai-note-app`** project (or create a new project with root directory set to `apps/web`).
2. Go to **Settings -> Environment Variables** and add `NEXT_PUBLIC_API_URL` pointing to your deployed API URL.
3. Deploy the frontend from your local monorepo root:
   ```bash
   cd apps/web
   vercel --prod
   ```

---

## 🧪 End-to-End API Testing & Verification Guide

Once both apps are deployed, verify the routes to ensure there are no timeouts or routing failures:

### 1. Verification of the Production Health Route
Check the health status of the application and Neon PostgreSQL connection:
```bash
curl -i https://api-snowy-rho-50.vercel.app/api/health
```
**Expected Response (200 OK):**
```json
{
  "status": "ok",
  "db": "connected"
}
```
> [!NOTE]
> If `db` shows `"error"`, the application will still serve endpoints using the local fallback store. Double check the pooled connection string settings in your Vercel panel.

### 2. Verify Authentication & JWT Flow
Test the signup endpoint with a test account:
```bash
curl -i -X POST https://api-snowy-rho-50.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"prodtest@noteflow.com","password":"SecurePassword123","name":"Prod Tester"}'
```
**Expected Response (201 Created):**
```json
{
  "user": {
    "email": "prodtest@noteflow.com",
    "name": "Prod Tester"
  },
  "token": "eyJhbGciOi..."
}
```

### 3. Verify Note Creation (CRUD Endpoints)
Submit a note using the authorization token retrieved from the signup:
```bash
curl -i -X POST https://api-snowy-rho-50.vercel.app/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_JWT_TOKEN]" \
  -d '{"title":"Production Verification Note","content":"<p>This note verifies that CRUD operations, Prisma connection pooling, and Vercel routing function seamlessly.</p>"}'
```
**Expected Response (201 Created):**
```json
{
  "id": "some-uuid-value",
  "title": "Production Verification Note",
  "content": "<p>This note...</p>",
  "userId": "user-uuid"
}
```

### 4. Verify AI Summary & Insights Generation
Test the AI endpoint using the created note's ID:
```bash
curl -i -X POST https://api-snowy-rho-50.vercel.app/api/notes/[NOTE_ID_FROM_PREVIOUS_STEP]/generate-summary \
  -H "Authorization: Bearer [YOUR_JWT_TOKEN]"
```
**Expected Response (201 Created):**
```json
{
  "id": "summary-uuid",
  "noteId": "note-uuid",
  "summary": "This note verifies that Prisma pooling and Vercel routing function seamlessly.",
  "actionItems": [
    "Verify CRUD operations",
    "Check Neon pooling",
    "Audit routing"
  ],
  "suggestedTitle": "NoteFlow Production Hardening Success",
  "tokensUsed": 0,
  "model": "openrouter/auto"
}
```

### 5. Verify Frontend Proxy Endpoint
Verify that the frontend Next.js server proxies the notes endpoint without CORS blockers:
```bash
curl -i https://ai-note-app-taupe.vercel.app/api/proxy/notes \
  -H "Authorization: Bearer [YOUR_JWT_TOKEN]"
```
**Expected Response (200 OK):**
Array containing your notes fetched from the backend.
