# NoteFlow - Deployment Guide

## Prerequisites

- GitHub repository with all code pushed
- Vercel account (https://vercel.com)
- OpenRouter API key (https://openrouter.ai)
- PostgreSQL database (e.g., Supabase, Railway, or Vercel Postgres)

---

## Step 1: Push to GitHub

**Important:** You need to unblock the GitHub secret first:

1. Visit: https://github.com/abhinavsai2006/AI-Note-App/security/secret-scanning/unblock-secret/3DnJaqs4f7VquoiRaRIUHx6DBXP
2. Click **"Allow"** button
3. Run in terminal:
   ```bash
   cd "c:\Users\mndab\Downloads\Collaborative AI Notes\noteflow"
   git push origin main
   ```

---

## Step 2: Setup PostgreSQL Database

**Option A: Supabase (Recommended)**
1. Go to https://supabase.com and create a project
2. In Project Settings → Database, copy the connection string
3. Format: `postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require`

**Option B: Railway.app**
1. Go to https://railway.app
2. Create new project → PostgreSQL
3. Copy connection string from Variables tab

---

## Step 3: Deploy Frontend (Next.js) on Vercel

1. **Connect GitHub Repository:**
   - Go to https://vercel.com/dashboard
   - Click **"Add New..."** → **"Project"**
   - Import your GitHub repository
   - Select `noteflow` folder as root

2. **Configure Environment Variables:**
   In Vercel dashboard → Settings → Environment Variables, add:
   ```
   NEXT_PUBLIC_API_URL=https://[your-api-domain.vercel.app]
   NEXT_PUBLIC_WS_URL=wss://[your-api-domain.vercel.app]
   ```

3. **Deploy:**
   - Vercel automatically deploys on push to main branch
   - Your app will be at: `https://noteflow-[username].vercel.app`

---

## Step 4: Deploy Backend (NestJS) on Vercel

1. **Update vercel.json:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "apps/web/package.json",
         "use": "@vercel/next"
       },
       {
         "src": "apps/api/src/main.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "apps/api/src/main.ts"
       },
       {
         "src": "/(.*)",
         "dest": "apps/web"
       }
     ]
   }
   ```

2. **Configure Environment Variables in Vercel:**
   ```
   DATABASE_URL=[your-postgres-connection-string]
   JWT_SECRET=[generate-random-string]
   JWT_REFRESH_SECRET=[generate-random-string]
   OPENROUTER_API_KEY=[your-openrouter-key]
   OPENROUTER_MODEL=openai/gpt-4-turbo-preview
   OPENROUTER_REFERER=https://noteflow-[username].vercel.app
   NEXT_PUBLIC_API_URL=https://[your-domain].vercel.app
   NEXT_PUBLIC_WS_URL=wss://[your-domain].vercel.app
   NODE_ENV=production
   ```

---

## Step 5: Run Database Migrations

After deploying, run Prisma migrations:

```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

---

## Step 6: Test Deployment

1. Visit your Vercel URL
2. Try signup/login
3. Create a note
4. Use AI assistant
5. Check browser console for any errors

---

## Troubleshooting

**Issue: "Failed to connect to database"**
- Verify DATABASE_URL in Vercel environment variables
- Ensure database is accessible from Vercel
- Check connection string format

**Issue: "WebSocket connection failed"**
- Verify NEXT_PUBLIC_WS_URL is correct
- Ensure backend API is deployed
- Check CORS settings in NestJS

**Issue: "AI Assistant not responding"**
- Verify OPENROUTER_API_KEY is set
- Check OpenRouter account has credit
- Review API logs in backend

---

## Production Checklist

- [ ] GitHub secret unblocked and code pushed
- [ ] PostgreSQL database created and accessible
- [ ] OpenRouter API key obtained and set
- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Vercel
- [ ] Database migrations ran successfully
- [ ] Environment variables set correctly
- [ ] Signup/login working
- [ ] Notes CRUD operations working
- [ ] AI assistant responding
- [ ] Share functionality working

---

## Support

For issues during deployment, check:
1. Vercel dashboard → Deployments → Logs
2. Vercel dashboard → Settings → Environment Variables
3. Supabase/Railway database status
4. GitHub repository push successful

