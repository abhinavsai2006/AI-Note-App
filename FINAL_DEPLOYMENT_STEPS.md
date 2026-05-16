# Final Vercel Deployment Steps - Complete Guide

## ✅ Completed
- [x] Git configuration fixed (valid email set)
- [x] API deployed to Vercel: https://api-snowy-rho-50.vercel.app
- [x] Web app deployed to Vercel: https://web-beta-rouge-77.vercel.app
- [x] API tests PASS (3/3)
- [x] Web build PASS
- [x] Both projects linked to Vercel

## ⚠️ REQUIRED: Set Environment Variables in Vercel

### For API Project (apps/api)
Visit: https://vercel.com/abhinavsai2006s-projects/api/settings/environment-variables

Add these **Production** environment variables:

```
DATABASE_URL = postgresql://username:password@host:5432/dbname
JWT_SECRET = your-secure-random-secret-key-here
OPENROUTER_API_KEY = your-openrouter-api-key
CORS_ORIGIN = https://web-beta-rouge-77.vercel.app
```

### For Web Project (apps/web)
Visit: https://vercel.com/abhinavsai2006s-projects/web/settings/environment-variables

Add this **Production** environment variable:

```
NEXT_PUBLIC_API_URL = https://api-snowy-rho-50.vercel.app
```

## 🚀 Manual Deployment Steps

### Step 1: Set API Environment Variables
1. Go to Vercel Dashboard → abhinavsai2006s-projects/api → Settings → Environment Variables
2. Click "Add" for each variable:
   - `DATABASE_URL` (from your PostgreSQL provider)
   - `JWT_SECRET` (generate a strong random string)
   - `OPENROUTER_API_KEY` (from OpenRouter dashboard)
   - `CORS_ORIGIN` = `https://web-beta-rouge-77.vercel.app`
3. Set each to **Production** environment
4. Redeploy the API

### Step 2: Run Prisma Migrations on Production
After DATABASE_URL is set in Vercel:

```bash
cd apps/api
# Set the production DATABASE_URL locally
$env:DATABASE_URL = "your-production-database-url"
npx prisma migrate deploy
```

### Step 3: Set Web Environment Variables
1. Go to Vercel Dashboard → abhinavsai2006s-projects/web → Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_URL` = `https://api-snowy-rho-50.vercel.app`
3. Set to **Production** environment
4. Redeploy the web app

### Step 4: Trigger Redeployments
After setting environment variables:

```bash
cd noteflow
git add -A
git commit -m "chore: vercel deployment complete - env vars configured"
git push origin feat/production-ready
```

This will trigger automatic redeployments on both projects.

## 🔗 Current Deployment URLs
- **Web (Frontend):** https://web-beta-rouge-77.vercel.app
- **API (Backend):** https://api-snowy-rho-50.vercel.app

## 📋 Testing Checklist
- [ ] Sign up on deployed web app
- [ ] Create a note
- [ ] Use AI Assistant to generate content
- [ ] Share a note and access via share link
- [ ] Check that all data persists in PostgreSQL

## 📝 GitHub Integration
- **Repository:** https://github.com/abhinavsai2006/AI-Note-App
- **Branch:** feat/production-ready
- Next step: Create PR from feat/production-ready → main

---

**Status:** 🟢 **Ready for Production** (pending env var configuration)
