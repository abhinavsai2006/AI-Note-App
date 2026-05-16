# NoteFlow Deployment Guide

## Overview

NoteFlow is a monorepo with separate frontend (Next.js) and backend (NestJS) applications:
- **Frontend**: `apps/web` → Deployed to Vercel
- **Backend**: `apps/api` → Deployed to Railway/Render
- **Database**: PostgreSQL → Neon/Supabase

## Quick Start

### 1. Prepare Repository

```bash
# Install root dependencies
npm install

# Verify structure
ls -la apps/web/package.json
ls -la apps/api/package.json
```

### 2. Local Testing

```bash
# Terminal 1: Start API
cd apps/api
npm run start:dev

# Terminal 2: Start Frontend
cd apps/web
npm run dev

# Visit http://localhost:3000
```

---

## Frontend Deployment (Vercel)

### Setup

1. **Push to GitHub**
```bash
git push origin main
```

2. **Import to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New..." → "Project"
   - Select GitHub repository
   - Click "Import"

3. **Configure Project**

   **Project Name**: `noteflow-web`
   
   **Root Directory**: `apps/web`
   
   **Framework Preset**: Next.js
   
   **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

4. **Environment Variables**
   
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_API_URL = https://your-api-domain.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your deployed app

### Verify Frontend Deployment

```bash
# Check for "Next.js" in build logs
# Should see: "✓ Using Next.js 14.2.35"

# Verify API connection
# Open browser → DevTools → Network
# Should see /api/notes requests to your API domain
```

---

## Backend Deployment (Railway)

### Setup

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Build**

   In Railway dashboard:
   - **Service Name**: `noteflow-api`
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm run build`
   - **Start Command**: `node dist/main`
   - **Node Version**: 20

4. **Add PostgreSQL Database**
   - Click "Add Service" → "Database" → "PostgreSQL"
   - Railway automatically sets `DATABASE_URL`

5. **Add Environment Variables**

   Click "Variables" and add:
   ```
   JWT_SECRET = [generate with: openssl rand -base64 32]
   CORS_ORIGIN = https://your-frontend-domain.vercel.app
   OPENROUTER_API_KEY = sk-or-v1-xxxxx
   OPENROUTER_MODEL = openrouter/auto
   NODE_ENV = production
   PORT = 3001
   ```

6. **Deploy**
   - Click "Deploy"
   - Monitor logs for errors
   - Wait for "Deploying..." to complete

7. **Get API URL**
   - Railway generates: `https://noteflow-api-prod.up.railway.app`
   - Note this URL

### Verify Backend Deployment

```bash
# Test API endpoint
curl https://noteflow-api-prod.up.railway.app/api/notes

# Should return: 200 OK with JSON array

# If 404, check root directory in Railway settings
# If "Database connection failed", verify DATABASE_URL
```

### Update Frontend with API URL

1. Go to Vercel dashboard
2. Select `noteflow-web` project
3. Go to "Settings" → "Environment Variables"
4. Update `NEXT_PUBLIC_API_URL` with Railway API URL
5. Redeploy (or create a new commit to trigger rebuild)

---

## Database Setup (Neon)

### PostgreSQL with Neon (Recommended)

1. **Create Neon Account**
   - Go to https://neon.tech
   - Sign up with GitHub

2. **Create Project**
   - Project name: `noteflow-prod`
   - Region: Select closest to you
   - PostgreSQL version: 15

3. **Get Connection String**
   - Copy "Connection string" (Prisma format)
   - Format: `postgresql://user:password@host/dbname?sslmode=require`

4. **Add to Railway**
   - In Railway dashboard → Variables
   - Set `DATABASE_URL` = your Neon connection string

5. **Run Migrations**

   In Railway terminal:
   ```bash
   npx prisma migrate deploy
   ```

   Or SSH into Railway and run:
   ```bash
   npm run build
   npm run start:prod
   ```

### Alternative: Supabase

1. Go to https://supabase.com
2. Create new project
3. Go to "Settings" → "Database"
4. Copy connection string
5. Add to `DATABASE_URL` in Railway

---

## Domain Setup (Optional)

### Add Custom Domain to Vercel

1. Go to Vercel dashboard → `noteflow-web`
2. Click "Settings" → "Domains"
3. Add custom domain
4. Follow DNS instructions

### Add Custom Domain to Railway

1. Go to Railway dashboard → `noteflow-api`
2. Click "Settings" → "Domains"
3. Add custom domain
4. Follow DNS instructions

---

## Monitoring & Debugging

### Check Vercel Logs
- Dashboard → Project → "Deployments"
- Click deployment → "View build logs"

### Check Railway Logs
- Dashboard → Service → "Logs" tab
- Scroll to see recent activity

### Common Issues

#### Frontend
- **"No Next.js version detected"**
  - Fix: Set Root Directory to `apps/web`
  - Verify: `apps/web/package.json` has `"next": "14.2.35"`

- **"API 404 errors"**
  - Fix: Update `NEXT_PUBLIC_API_URL` in Vercel
  - Verify: API is deployed and running

#### Backend
- **"Cannot find module"**
  - Fix: Ensure `npm run build` completes locally
  - Check: All dependencies in `package.json`

- **"Database connection error"**
  - Fix: Verify `DATABASE_URL` is correct
  - Verify: Database is accessible from Railway region

### Health Checks

```bash
# Frontend health
curl -I https://your-frontend.vercel.app
# Should return: 200 OK

# Backend health
curl https://your-api-domain/api/notes
# Should return: 200 OK with JSON

# Verify API connection
# In frontend, open DevTools → Network
# Make a request
# Should see /api/notes going to correct domain
```

---

## Maintenance

### Update Dependencies

```bash
# Frontend
cd apps/web
npm update

# Backend
cd apps/api
npm update

# Test locally
npm run build

# Commit and push (triggers redeploy)
```

### Database Backups

- **Neon**: Auto-backups included
- **Supabase**: Auto-backups included
- **Railway**: Purchase backup addon

### Monitoring

- Set up error tracking: Sentry
- Set up uptime monitoring: Uptime.com
- Set up logging: Vercel + Railway dashboards

---

## Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] DATABASE_URL uses production database
- [ ] CORS_ORIGIN matches frontend domain
- [ ] HTTPS enabled on all domains
- [ ] Environment variables stored securely
- [ ] No secrets in git repository
- [ ] Regular password rotations
- [ ] Database backups enabled
- [ ] Error logs monitored
- [ ] Rate limiting enabled (if available)

---

## Troubleshooting

### Build Fails on Vercel
```bash
# Ensure local build works
cd apps/web
npm run build

# Check package.json for build script
cat package.json | grep build

# Verify all dependencies installed
npm ci && npm run build
```

### API Not Reachable
```bash
# Check if Railway app is running
# Dashboard → Service → "Deployments"

# Verify environment variables
# Dashboard → Service → "Variables"

# Check logs
# Dashboard → Service → "Logs"

# Test locally
cd apps/api
npm run start:prod
curl http://localhost:3001/api/notes
```

### Database Connection Fails
```bash
# Verify connection string format
# Should be: postgresql://user:password@host:port/database

# Test connection locally
psql $DATABASE_URL

# Check if SSL required
# Neon requires: ?sslmode=require
```

---

## Rollback

### Revert Frontend
- Vercel → Deployments → Select previous deployment → "Redeploy"

### Revert Backend
- Railway → Deployments → Select previous deployment → "Redeploy"

---

## Support

For issues:
1. Check logs (Vercel/Railway dashboards)
2. Verify environment variables
3. Test locally first
4. Check GitHub issues
5. Contact support

