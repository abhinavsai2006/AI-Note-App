Vercel Deployment Guide

This project is a monorepo. Recommended setup is to create two Vercel projects:

1) Web (frontend)
- Root: `apps/web`
- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables (set in Vercel dashboard):
  - `NEXT_PUBLIC_API_URL` -> https://your-api-url.vercel.app
  - `NEXT_PUBLIC_APP_URL` -> https://your-web-url.vercel.app
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_MODEL`

2) API (backend)
- Root: `apps/api`
- Build command: `npm run build`
- Start command: `npm run start:prod`
- Environment variables:
  - `DATABASE_URL` (Vercel Postgres or external Postgres)
  - `JWT_SECRET`
  - `OPENROUTER_API_KEY`
  - `REDIS_URL` (optional)

Notes:
- For DB migrations on deploy, either run `npx prisma migrate deploy` in a CI step or enable a migration action in your deploy pipeline. The repo includes a GitHub Action `prisma-deploy.yml` that runs migrations on push to `main` using the `DATABASE_URL` secret.
- Store secrets in Vercel Environment Variables, not in the repository.
