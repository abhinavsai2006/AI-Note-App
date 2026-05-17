# Vercel Environment Variables - Verification Checklist

## Current Status
- ✅ Frontend: Working (200 OK)
- ❌ Backend: Failing (404 with bom1 error)
- ❌ Proxy: Failing (can't reach backend)

## The Problem
The backend is not receiving `DATABASE_URL` and `JWT_SECRET` environment variables on Vercel, causing it to fail on startup.

---

## ✅ VERIFICATION STEPS (DO THIS NOW)

### Step 1: Check Backend Environment Variables on Vercel

1. Go to **https://vercel.com/dashboard**
2. Click on **`api-snowy-rho-50`** project (the backend)
3. Go to **Settings** tab (top right)
4. Click **Environment Variables** (left sidebar)

**You should see these variables already set:**
```
DATABASE_URL = postgresql://...
JWT_SECRET = ...
```

**If they're NOT there, ADD them:**

**Variable 1:**
- Name: `DATABASE_URL`
- Value: (your PostgreSQL connection string)
- Environments: Select ALL three ✓ Production, ✓ Preview, ✓ Development

**Variable 2:**
- Name: `JWT_SECRET`
- Value: (your JWT secret key)
- Environments: Select ALL three ✓ Production, ✓ Preview, ✓ Development

5. Click **Save**

### Step 2: Verify Variables are Saved

After saving:
- Refresh the page
- Confirm you see both variables in the list
- Check that all environments are selected

### Step 3: Redeploy Backend

Go to **Deployments** tab and click the **3-dot menu** on the latest deployment, then click **Redeploy**.

Or push a small change:
```bash
cd "c:\Users\mndab\Downloads\Collaborative AI Notes"
git commit --allow-empty -m "Trigger backend redeploy with env vars"
git push
```

### Step 4: Wait for Build

Monitor the build at https://vercel.com/dashboard

Check **Build Logs** for:
- ❌ "Error" or "failed" messages
- ✅ "Completed in Xs" (means success)

### Step 5: Test Again

```powershell
# Test backend
$api = Invoke-WebRequest -Uri "https://api-snowy-rho-50.vercel.app/api/notes" -TimeoutSec 15 -ErrorAction Continue -UseBasicParsing
if($?) { "✅ Status: $($api.StatusCode)" } else { "Status: $($Error[0].Exception.Message)" }
```

---

## If Still Not Working

### Check Build Logs
1. Vercel Dashboard → `api-snowy-rho-50` → Deployments
2. Click latest deployment
3. Scroll down to **Build Logs**
4. Look for error messages related to:
   - "DATABASE_URL"
   - "prisma"
   - "ECONNREFUSED" (database not connecting)

### Common Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `DATABASE_URL not set` | Env var not added | Go to Settings → Environment Variables, add it |
| `Prisma error` | Database schema mismatch | Verify DATABASE_URL is correct |
| `ECONNREFUSED` | Database not accessible | Check PostgreSQL server is running |
| `Timeout during build` | Database taking too long | Increase Vercel function timeout |

---

## Environment Variables Reference

### From Neon (if you used it)
Connection string format:
```
postgresql://user@ep-xyz.neon.tech/database?sslmode=require
```

### From Supabase
Connection string format:
```
postgresql://postgres.[project_id]:[password]@db.supabase.co:5432/postgres
```

### JWT Secret
Any random string of 32+ characters:
```
my-super-secret-jwt-key-12345678901234567890
```

---

## Quick Test After Fix

Once backend is working (should return 200 or 401 for `/api/notes`):

```powershell
# Test 1: Backend responds
$api = Invoke-WebRequest "https://api-snowy-rho-50.vercel.app/api/notes" -TimeoutSec 15 -UseBasicParsing -ErrorAction Continue
"Backend: $($api.StatusCode)"

# Test 2: Frontend proxy works
$proxy = Invoke-WebRequest "https://ai-note-app-taupe.vercel.app/api/proxy/notes" -TimeoutSec 15 -UseBasicParsing -ErrorAction Continue
"Proxy: $($proxy.StatusCode)"

# Test 3: App loads
$app = Invoke-WebRequest "https://ai-note-app-taupe.vercel.app/" -TimeoutSec 15 -UseBasicParsing -ErrorAction Continue
"App: $($app.StatusCode)"
```

---

## Files That Were Fixed

| File | What Was Fixed | Commit |
|------|---|---|
| `apps/web/next.config.mjs` | Rewrite rules for proxy | 8790eb6 |
| `apps/web/src/app/api/proxy/[...path]/route.ts` | Use env variable for API URL | 8790eb6 |
| `apps/web/src/lib/api.ts` | Removed accidental PowerShell code | 5d13689 |
| `apps/api/vercel.json` | Fixed function pattern | ee750cf |

---

## Summary

**Your app structure is now correct.** The only remaining issue is **environment variables not being set on the backend Vercel project**.

**Action Required:**
1. Go to Vercel → `api-snowy-rho-50` → Settings → Environment Variables
2. Verify `DATABASE_URL` and `JWT_SECRET` are set
3. If not, add them
4. Redeploy
5. Test

**Estimated Time:** 5 minutes to complete all steps

---

**Status Last Updated:** May 17, 2026 - 14:30 UTC
