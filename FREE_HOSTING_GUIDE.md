# Free Cloud Hosting Guide — Pari Tower Festival Committee (PTFC)

This guide explains how to host the **Pari Tower Festival Committee (PTFC)** web application **100% free of cost** with continuous deployment, automated SSL certificates, and zero server maintenance.

---

## Architecture Overview

The app is built with **Next.js 14 (App Router)** and **Prisma ORM**.

In cloud environments (like Vercel or AWS), the local filesystem is ephemeral (read-only in serverless functions). Therefore, the best free production architecture separates:
1. **Web & API Hosting**: Free on **Vercel** (the creators of Next.js).
2. **Persistent Database**: Free on **Turso** (Cloud SQLite) or **Supabase / Neon** (Free Cloud PostgreSQL).

---

## Recommended Method: Vercel + Turso (100% Free Forever)

### Why this stack?
- **Vercel Hobby Tier**: Free unlimited deployments, fast edge CDN in Mumbai/India, free HTTPS/SSL, custom domain support (e.g., `paritower-utsav.vercel.app` or your society's custom domain).
- **Turso Free Tier**: Native SQLite/LibSQL database, 9 GB free storage (enough for 10+ years of society festivals), 1 billion row reads/month, zero cold starts.

---

### Step-by-Step Deployment Instructions

#### Step 1: Push Code to GitHub
1. Create a private or public repository on [GitHub](https://github.com/new), named `PariTower-UtsavSamiti`.
2. Push your project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial PTFC release"
   git branch -M main
   git remote add origin https://github.com/<your-username>/PariTower-UtsavSamiti.git
   git push -u origin main
   ```

---

#### Step 2: Create Free Cloud SQLite Database on Turso
1. Sign up for free at [turso.tech](https://turso.tech) (using your GitHub account).
2. Install Turso CLI or create database from web dashboard:
   - Click **Create Database**.
   - Name: `pari-tower-db`.
   - Location: Select `bom` (Mumbai, India) for lowest latency.
3. Get your **Database URL** and **Auth Token**:
   - Database URL will look like: `libsql://pari-tower-db-[username].turso.io`
   - Auth Token will look like: `eyJhbGciOi...`
4. Set your connection string in Prisma:
   ```env
   DATABASE_URL="libsql://pari-tower-db-[username].turso.io?authToken=YOUR_TOKEN"
   ```

*(Alternative: If you prefer PostgreSQL, [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com) provide free cloud databases with a simple `postgres://...` connection string).*

---

#### Step 3: Deploy to Vercel (1-Click)
1. Sign in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **"Add New Project"** and import your `PariTower-UtsavSamiti` repository.
3. Under **Environment Variables**, add:
   - `DATABASE_URL`: Your Turso or Neon database connection string.
   - `SESSION_SECRET`: Any random 64-character string for signing auth cookies.
4. Click **Deploy**.
5. Within 60 seconds, Vercel will build and assign you a live HTTPS URL:
   - `https://pari-tower-utsav-samiti.vercel.app`

---

#### Step 4: Run Initial Database Migration on Vercel
In your local terminal or via GitHub Actions, push the database schema to the cloud database:
```bash
npx prisma db push
node prisma/seed.js
```
Your 262 flats, refugee units, and admin credentials will be live in the cloud!

---

## Alternative Free Hosting Option: Render.com

If you prefer a single service that runs like a traditional VPS server:
1. Sign up at [render.com](https://render.com).
2. Click **New Web Service** -> Connect GitHub repository.
3. Settings:
   - Environment: `Node`
   - Build Command: `npm install && npx prisma db push && npm run build`
   - Start Command: `npm start`
4. Choose the **Free** instance type.
5. Render provides a free URL: `https://pari-tower-utsav.onrender.com`.

---

## Comparison Summary

| Feature | Vercel + Turso (Recommended) | Render.com |
|---|---|---|
| **Cost** | 100% Free Forever | 100% Free |
| **Speed in India** | Instant Edge (Mumbai POP) | Good |
| **Sleep / Spin Down** | Never sleeps (0ms cold start) | Free tier spins down after 15 min idle |
| **Custom Domain** | Free SSL on your own domain | Free SSL on your own domain |
| **Setup Time** | ~10 minutes | ~5 minutes |