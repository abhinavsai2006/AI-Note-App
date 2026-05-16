# NoteFlow Production Deployment Configuration

## Production URLs

### Frontend
- **URL**: https://web-beta-rouge-77.vercel.app
- **Platform**: Vercel
- **Root Directory**: `apps/web`

### Backend API
- **URL**: https://api-snowy-rho-50.vercel.app
- **Platform**: Vercel (Alternative: Railway)
- **Root Directory**: `apps/api`

---

## Vercel Environment Variables

### Frontend (Vercel Dashboard → Settings → Environment Variables)

```
NEXT_PUBLIC_API_URL=https://api-snowy-rho-50.vercel.app
```

**Deployment Conditions**: Production, Preview, Development
**Purpose**: Tells frontend where backend API is located

### Backend (Vercel Dashboard → Settings → Environment Variables)

```
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
JWT_SECRET=[generate-a-long-random-string]
CORS_ORIGIN=https://web-beta-rouge-77.vercel.app
NODE_ENV=production
```

**Database Setup**:
1. Use Neon, Supabase, or Railway PostgreSQL
2. Copy connection string to `DATABASE_URL`
3. Ensure SSL mode is enabled

**JWT Secret**:
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**CORS Origin**:
- Must be the frontend URL: `https://web-beta-rouge-77.vercel.app`
- Do NOT set to API URL itself
- This prevents unauthorized access from other domains

---

## Deployment Steps

### 1. Update GitHub Repository

```bash
cd noteflow

# Add all changes
git add .

# Commit with clear message
git commit -m "Phase 2: Fix CORS and production environment setup

- Fixed backend CORS to use frontend URL
- Added production env vars to apps/web/.env.local
- Added production env vars to apps/api/.env.local  
- Updated API base URL configuration
- Ready for Vercel/Railway deployment"

# Push to GitHub
git push origin main
```

### 2. Deploy Backend to Vercel

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select the `api` project or import if new
3. Set **Root Directory** to `apps/api`
4. Add Environment Variables:
   - `DATABASE_URL` (from PostgreSQL provider)
   - `JWT_SECRET` (generate secure key)
   - `CORS_ORIGIN=https://web-beta-rouge-77.vercel.app`
   - `NODE_ENV=production`
5. Click **Deploy**

### 3. Deploy Frontend to Vercel

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select the `web` project or import if new
3. Set **Root Directory** to `apps/web`
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://api-snowy-rho-50.vercel.app`
5. Click **Deploy**

### 4. Verify Deployment

```bash
# Test frontend loads
curl https://web-beta-rouge-77.vercel.app

# Test backend is running
curl https://api-snowy-rho-50.vercel.app/api

# Test CORS allows frontend
curl -H "Origin: https://web-beta-rouge-77.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     https://api-snowy-rho-50.vercel.app/api

# Test authentication
curl -X POST https://api-snowy-rho-50.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@12345"}'
```

---

## CORS Configuration Explanation

### Current Setup

**apps/api/src/main.ts**:
```typescript
const corsOriginEnv = process.env.CORS_ORIGIN || 'https://web-beta-rouge-77.vercel.app';
const corsOrigins = corsOriginEnv
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Always include localhost for development
if (process.env.NODE_ENV !== 'production') {
  corsOrigins.push('http://localhost:3000');
  corsOrigins.push('http://localhost:5173');
  corsOrigins.push('http://127.0.0.1:3000');
}

app.enableCors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
});
```

### Why This Matters

- **Wrong**: `origin: "https://api-snowy-rho-50.vercel.app"`
  - Allows API to access itself (incorrect)
  - Blocks frontend from accessing API (403 CORS error)
  - Security issue: opens access to wrong origins

- **Correct**: `origin: "https://web-beta-rouge-77.vercel.app"`
  - Allows frontend to access API
  - Blocks other domains from accessing API
  - Secure: only specified origins can access

---

## Frontend API Configuration

**apps/web/src/lib/api.ts**:
```typescript
// Production: https://api-snowy-rho-50.vercel.app
// Development: http://localhost:3001
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
```

### Environment Files

**.env.local** (Development):
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Vercel Dashboard** (Production):
```
NEXT_PUBLIC_API_URL=https://api-snowy-rho-50.vercel.app
```

---

## Database Setup (Choose One)

### Option 1: Neon (Recommended for Vercel)

1. Go to [https://neon.tech](https://neon.tech)
2. Create account and project
3. Copy connection string
4. Add to Vercel env: `DATABASE_URL=postgresql://...`
5. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Option 2: Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Create project
3. Get connection string from Settings → Database
4. Add to Vercel env: `DATABASE_URL=postgresql://...`

### Option 3: Railway

1. Go to [https://railway.app](https://railway.app)
2. Create PostgreSQL database
3. Get connection string
4. Add to Vercel env: `DATABASE_URL=postgresql://...`

---

## Production Checklist

- [ ] Backend CORS configured correctly
- [ ] Frontend `NEXT_PUBLIC_API_URL` set
- [ ] Backend `CORS_ORIGIN` set to frontend URL
- [ ] JWT_SECRET generated and stored
- [ ] DATABASE_URL configured
- [ ] Both apps deployed to Vercel
- [ ] Frontend loads without errors
- [ ] Login/signup works
- [ ] Notes CRUD works
- [ ] API calls return correct data
- [ ] No 404 API errors
- [ ] No CORS errors in browser console
- [ ] Cookies/sessions work correctly

---

## Testing Production

### Test Login
```bash
curl -X POST https://api-snowy-rho-50.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@12345"}'
```

### Test Note Creation
```bash
curl -X POST https://api-snowy-rho-50.vercel.app/api/notes \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"<p>Test content</p>"}'
```

### Test CORS Headers
```bash
curl -i -X OPTIONS https://api-snowy-rho-50.vercel.app/api \
  -H "Origin: https://web-beta-rouge-77.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

---

## Monitoring & Debugging

### Check Deployment Status
1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on project
3. View recent deployments
4. Check logs for errors

### View Production Logs
```bash
# Using Vercel CLI
vercel logs noteflow-api
vercel logs noteflow-web

# Or use Vercel Dashboard → Deployments → Runtime Logs
```

### Common Issues

**Issue**: "403 CORS error"
**Fix**: Check backend `CORS_ORIGIN` env var is correct frontend URL

**Issue**: "Cannot find module"
**Fix**: Ensure root directory is set correctly in Vercel

**Issue**: "Database connection refused"
**Fix**: Verify `DATABASE_URL` is correct and database is accessible

**Issue**: "401 Unauthorized"
**Fix**: Ensure token is being sent with `Authorization: Bearer` header

---

## Next Steps

1. ✅ Push to GitHub (run git commands above)
2. ✅ Deploy backend to Vercel
3. ✅ Deploy frontend to Vercel
4. ✅ Test production deployment
5. 🚀 Start Phase 3: Notes workspace improvements

---

## Phase 3 Ready

After successful production deployment, proceed with:
- Auto-save functionality
- Tag management
- Enhanced editor features
- Version history

See PRODUCTION_ROADMAP.md for complete plan.

