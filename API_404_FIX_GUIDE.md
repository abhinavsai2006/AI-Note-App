# API 404 Error Fix Guide

## Issue Summary
- **Error**: `GET https://ai-note-app-taupe.vercel.app/api/proxy/notes? 404 (Not Found)`
- **Message**: "Server notes unavailable: Error: The page could not be found"
- **Cause**: Proxy endpoint not properly forwarding requests to backend API

## Root Causes Fixed

### 1. ✅ Hardcoded API URL in Proxy Handler
**File**: `apps/web/src/app/api/proxy/[...path]/route.ts`

**Problem**: 
- The proxy handler was hardcoded to use `https://api-snowy-rho-50.vercel.app`
- If the backend URL changes or is misconfigured, requests fail

**Fix Applied**:
```typescript
// BEFORE (hardcoded)
const targetUrl = `https://api-snowy-rho-50.vercel.app/api/${path}...`;

// AFTER (uses environment variable)
const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const targetUrl = `${apiBase}/api/${path}...`;
```

### 2. ✅ Improved Error Handling
**What Changed**:
- Added detailed console logging for debugging
- Returns 502 (Bad Gateway) instead of 500 when backend is unavailable
- Includes error details in response body

### 3. ✅ Rewrite Rules Configuration
**File**: `apps/web/next.config.mjs`

**Updated**:
```javascript
async rewrites() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  return {
    beforeFiles: [],
    afterFiles: [
      {
        source: "/api/:path*",
        destination: `${apiBase}/:path*`,
      },
    ],
  };
}
```

This ensures route handlers are evaluated before rewrites.

## Deployment & Testing Steps

### Step 1: Commit and Deploy
```bash
git add .
git commit -m "Fix API proxy handler - use env variable and improve error handling"
git push
```

### Step 2: Verify Vercel Deployment
1. Go to https://vercel.com
2. Check **ai-note-app-taupe** project
3. Wait for build to complete
4. Check build logs for errors

### Step 3: Test the Proxy
```bash
# Test proxy endpoint
curl https://ai-note-app-taupe.vercel.app/api/proxy/notes

# Test backend directly (if publicly accessible)
curl https://api-snowy-rho-50.vercel.app/api/notes

# Test with Authorization header
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://ai-note-app-taupe.vercel.app/api/proxy/notes
```

### Step 4: Check Browser Console
1. Open app at https://ai-note-app-taupe.vercel.app
2. Open DevTools (F12)
3. Go to **Console** tab
4. Should see logs from proxy handler:
   ```
   [Proxy] Forwarding request: {
     from: '/api/proxy/notes',
     to: 'https://api-snowy-rho-50.vercel.app/api/notes',
     method: 'GET',
   }
   ```

## Troubleshooting

### If Still Getting 404

**Check 1: Backend is Running**
```bash
curl https://api-snowy-rho-50.vercel.app/api
# Should return something like: {"statusCode":404,"message":"Route GET / not found"...}
```

**Check 2: Environment Variable Set**
- Verify `NEXT_PUBLIC_API_URL` is set in Vercel Project Settings
- Should be: `https://api-snowy-rho-50.vercel.app`

**Check 3: Proxy Handler Logs**
- Check Vercel Function Logs:
  1. Go to Vercel Dashboard → Project → Deployments
  2. Click latest deployment
  3. Go to Runtime Logs
  4. Look for `[Proxy]` messages

**Check 4: Backend CORS**
```bash
# Check CORS headers
curl -i -X OPTIONS https://api-snowy-rho-50.vercel.app/api/notes \
  -H "Origin: https://ai-note-app-taupe.vercel.app" \
  -H "Access-Control-Request-Method: GET"

# Should include:
# Access-Control-Allow-Origin: https://ai-note-app-taupe.vercel.app
```

### If Backend Not Responding (502 Error)

**Possible Issues**:
1. Backend not deployed or crashed
2. Backend database not connected
3. Backend environment variables not set

**Check Backend**:
1. Go to backend project on Vercel
2. Check:
   - **Environment Variables**: `DATABASE_URL`, `JWT_SECRET` set
   - **Deployment Status**: Should be "Ready"
   - **Runtime Logs**: Look for errors
3. Manual test: `curl https://api-snowy-rho-50.vercel.app/api`

## Alternative: Direct CORS (If Proxy Fails)

If the proxy approach doesn't work after troubleshooting, you can switch to direct CORS requests:

### Option 1: Update Frontend Logic
```typescript
// In apps/web/src/lib/api.ts
const getApiBase = () => {
  // Always use direct URL, let backend handle CORS
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    .replace(/\/$/, '');
};
```

### Option 2: Ensure Backend CORS is Configured
The backend already has this in `apps/api/src/main.ts`:
```typescript
app.enableCors({
  origin: ['https://ai-note-app-taupe.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
});
```

## Configuration Checklist

- [ ] Web app environment variable set: `NEXT_PUBLIC_API_URL=https://api-snowy-rho-50.vercel.app`
- [ ] Backend environment variables set: `DATABASE_URL`, `JWT_SECRET`
- [ ] Backend deployed and "Ready" status on Vercel
- [ ] Proxy handler updated to use environment variable
- [ ] Web app redeployed after changes
- [ ] CORS origins include frontend domain
- [ ] Logs show `[Proxy]` messages when making requests

## Related Files

| File | Purpose | Status |
|------|---------|--------|
| `apps/web/src/app/api/proxy/[...path]/route.ts` | Proxy handler | ✅ Fixed |
| `apps/web/next.config.mjs` | Rewrite rules | ✅ Fixed |
| `apps/web/vercel.json` | Environment variables | ✅ Correct |
| `apps/api/src/main.ts` | Backend CORS config | ✅ Correct |
| `apps/web/src/lib/api.ts` | API client | ✅ Uses API_BASE |

## Next Steps

1. **Deploy**: Push changes and wait for Vercel build
2. **Test**: Try calling an API endpoint and check logs
3. **Monitor**: Watch Vercel Function Logs for errors
4. **Troubleshoot**: Use the troubleshooting guide above if issues persist
5. **Report**: If still broken, check all environment variables and backend status

---

**Last Updated**: May 17, 2026
**Changes Made**: Fixed hardcoded API URL in proxy handler, improved error handling and rewrite rules
