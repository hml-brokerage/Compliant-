# Free Netlify Deployment Guide

This guide provides step-by-step instructions for deploying the Compliant Platform to Netlify's free tier.

> **⚠️ IMPORTANT**: Netlify deployment is intended for **demos, prototyping, and testing** purposes. For production workloads and enterprise use, deploy to traditional platforms (AWS ECS, Heroku, DigitalOcean, etc.) that don't have serverless limitations. The application is fully compatible with both serverless and traditional deployment platforms.

## 📋 Overview

The Compliant Platform consists of two main components:
- **Frontend**: Next.js 14 application (deployed to Netlify)
- **Backend**: NestJS API server (deployed to Netlify Functions)

This guide covers deploying **both frontend and backend** to Netlify for free.

## ⚠️ Important Notes on Backend Deployment

**Netlify Functions** work differently from traditional servers:
- Serverless functions have a **10-second execution limit** (free tier)
- Each function invocation is stateless
- Best for API endpoints, not long-running processes
- Database connections should use connection pooling
- **Not recommended for production** - Use traditional platforms for enterprise workloads

**For production use**, consider:
- AWS ECS/EKS - Full container orchestration
- DigitalOcean App Platform - Simple container deployment
- Render/Railway - Easy deployment with better timeouts
- Heroku - Traditional PaaS (Hobby plan: $7/month)
- Or any traditional Node.js hosting platform

## 🆓 Netlify Free Tier Limits

Netlify's free tier includes:
- ✅ 100 GB bandwidth per month
- ✅ Automatic SSL certificate
- ✅ Continuous deployment from Git
- ✅ Custom domain support
- ✅ Instant cache invalidation
- ✅ Deploy previews for pull requests

## 🚀 Quick Deploy (Frontend Only)

### Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://www.netlify.com/) (free)
2. **GitHub/GitLab/Bitbucket**: Repository must be hosted on a Git provider
3. **Backend API**: You'll need a hosted backend API (see backend deployment options below)

### Method 1: Deploy via Netlify Dashboard (Recommended)

#### Step 1: Connect to Git Provider

1. Log in to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories
5. Select the `hml-brokerage/Compliant-` repository

#### Step 2: Configure Build Settings

Configure the following settings:

**Base directory**: `packages/frontend`

**Build command**: 
```bash
cd ../shared && pnpm install && pnpm build && cd ../frontend && pnpm install && pnpm build
```

**Publish directory**: `packages/frontend/.next`

**Node version**: Set to 20.x or higher

#### Step 3: Set Environment Variables

In the Netlify dashboard, go to **Site settings** → **Environment variables** and add:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-api-domain.com/api` | Your backend API URL |
| `NODE_VERSION` | `20.0.0` | Node.js version |

⚠️ **Important**: Replace `https://your-api-domain.com/api` with your actual backend API URL.

#### Step 4: Deploy

1. Click **"Deploy site"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Your site will be available at `https://random-name-12345.netlify.app`
4. You can change this to a custom subdomain or use your own domain

### Method 2: Deploy via Netlify CLI

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Login to Netlify

```bash
netlify login
```

#### Step 3: Initialize Netlify Site

```bash
cd /path/to/Compliant-
netlify init
```

Follow the prompts:
- Choose "Create & configure a new site"
- Select your team
- Enter a site name (or leave blank for auto-generated)

#### Step 4: Configure Build Settings

Create a `netlify.toml` file in the project root:

```toml
[build]
  base = "packages/frontend"
  command = "cd ../shared && pnpm install && pnpm build && cd ../frontend && pnpm install && pnpm build"
  publish = "packages/frontend/.next"

[build.environment]
  NODE_VERSION = "20.0.0"
  NEXT_PUBLIC_API_URL = "https://your-api-domain.com/api"

[[redirects]]
  from = "/api/*"
  to = "https://your-api-domain.com/api/:splat"
  status = 200
  force = true
  
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

⚠️ **Important**: Replace `https://your-api-domain.com` with your actual backend API URL.

#### Step 5: Deploy

```bash
netlify deploy --prod
```

### Method 3: One-Click Deploy Button

Add this badge to your README.md for one-click deployment:

```markdown
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/hml-brokerage/Compliant-)
```

## 🚀 Backend Deployment to Netlify (Option 0: Netlify Functions)

**✅ Best for: Full-stack deployment on Netlify**

Deploy your NestJS backend as Netlify Functions for a complete serverless solution.

### Prerequisites

1. Netlify account
2. Frontend already deployed to Netlify (see above)
3. PostgreSQL database (Supabase, Neon, etc.)

### Step 1: Create Netlify Function Wrapper

Create `netlify/functions/api.js` in your project root:

```javascript
// netlify/functions/api.js
const serverless = require('serverless-http');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../../packages/backend/dist/app.module');

let cachedApp;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    
    app.enableCors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    });
    
    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

exports.handler = async (event, context) => {
  const app = await bootstrap();
  const handler = serverless(app.getHttpAdapter().getInstance());
  return handler(event, context);
};
```

### Step 2: Update netlify.toml Configuration

Update your `netlify.toml` to include backend build and function configuration:

```toml
[build]
  base = "."
  command = """
    cd packages/shared && pnpm install && pnpm build &&
    cd ../backend && pnpm install && pnpm build &&
    cd ../frontend && pnpm install && pnpm build
  """
  publish = "packages/frontend/.next"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20.0.0"
  PNPM_VERSION = "8.15.0"

# Redirect API calls to Netlify Functions
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

# Function settings
[functions]
  node_bundler = "esbuild"
  
[[functions.api]]
  # Increase timeout (requires Netlify Pro for >10s)
  timeout = 10
```

### Step 3: Install Serverless Dependencies

Add to `packages/backend/package.json`:

```json
{
  "dependencies": {
    "serverless-http": "^3.2.0"
  }
}
```

Then run:
```bash
cd packages/backend
pnpm install
```

### Step 4: Set Environment Variables

In Netlify Dashboard, add these environment variables:

**Frontend Variables:**
- `NEXT_PUBLIC_API_URL` = `/.netlify/functions/api`

**Backend Variables:**
- `DATABASE_URL` = Your PostgreSQL connection string
- `JWT_SECRET` = Your JWT secret (min 32 chars)
- `JWT_REFRESH_SECRET` = Your refresh secret (min 32 chars)
- `JWT_EXPIRATION` = `15m`
- `JWT_REFRESH_EXPIRATION` = `7d`
- `NODE_ENV` = `production`
- `FRONTEND_URL` = Your Netlify site URL

### Step 5: Deploy

```bash
# Commit changes
git add netlify/functions/api.js netlify.toml
git commit -m "Add Netlify Functions backend deployment"
git push

# Netlify will automatically rebuild and deploy
```

### ⚠️ Important Limitations

**Free Tier Constraints:**
- **10-second timeout** per function execution
- Cold starts may take 1-2 seconds
- Not suitable for long-running operations
- Database connections should use pooling

**Workarounds:**
1. Use connection pooling (e.g., Prisma connection pooling)
2. Optimize slow queries
3. Consider Netlify Pro ($19/month) for 26-second timeout
4. For heavy workloads, use alternative backend hosting (see below)

### Step 6: Test Your Deployment

```bash
# Test the API endpoint
curl https://your-site.netlify.app/.netlify/functions/api/health

# Or visit in browser
# https://your-site.netlify.app/.netlify/functions/api/docs
```

## 🔧 Alternative Backend Deployment Options

If Netlify Functions' limitations don't work for your use case, consider these alternatives:

### Option 1: Render (Free Tier - Recommended)

**✅ Best for small projects**

1. Sign up at [render.com](https://render.com/)
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `cd packages/backend && pnpm install && pnpm build`
   - **Start Command**: `cd packages/backend && pnpm start:prod`
   - **Environment Variables**: Add all required env vars from `.env.example`
5. Deploy

**Free tier includes:**
- 512 MB RAM
- Automatic SSL
- Free PostgreSQL database (90 day expiry)

### Option 2: Railway (Free $5 Credit)

**✅ Great for testing**

1. Sign up at [railway.app](https://railway.app/)
2. Create a new project from GitHub
3. Add PostgreSQL database service
4. Configure build:
   - **Root Directory**: `packages/backend`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start:prod`
5. Set environment variables
6. Deploy

### Option 3: Heroku (Free Tier Discontinued)

Heroku no longer offers a free tier, but their hobby plan ($7/month) is still affordable.

### Option 4: Fly.io (Free Tier)

**✅ Good for small APIs**

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch app: `fly launch` (from backend directory)
4. Deploy: `fly deploy`

**Free tier includes:**
- Up to 3 shared-cpu VMs
- 160 GB bandwidth

### Option 5: AWS Free Tier (12 Months)

Deploy backend to AWS Elastic Beanstalk or ECS (requires more configuration).

## 🔐 Environment Variables Setup

### Frontend Environment Variables

Set these in Netlify Dashboard under **Site settings** → **Environment variables**:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
```

### Backend Environment Variables

Set these in your backend hosting platform:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=3001
NODE_ENV=production
```

## 🗄️ Database Setup

### Option 1: Supabase (Free Tier)

**✅ Recommended for free PostgreSQL**

1. Sign up at [supabase.com](https://supabase.com/)
2. Create a new project
3. Get connection string from **Settings** → **Database**
4. Use this as your `DATABASE_URL`

**Free tier includes:**
- 500 MB database storage
- Unlimited API requests
- Auto backups

### Option 2: ElephantSQL (Free Tier)

1. Sign up at [elephantsql.com](https://www.elephantsql.com/)
2. Create a "Tiny Turtle" free plan
3. Get connection URL
4. Use as `DATABASE_URL`

**Free tier includes:**
- 20 MB storage
- Shared server

### Option 3: Neon (Free Tier)

1. Sign up at [neon.tech](https://neon.tech/)
2. Create a project
3. Get connection string
4. Use as `DATABASE_URL`

**Free tier includes:**
- 512 MB storage per database
- Automatic branching

## 🚦 Post-Deployment Setup

### 1. Run Database Migrations

After deploying backend, run migrations:

```bash
# If using Render, Railway, or Fly.io
# SSH into your instance or use their CLI
npx prisma migrate deploy
```

### 2. Seed Database (Optional)

For demo data:

```bash
cd packages/backend
pnpm db:seed
```

### 3. Test Your Deployment

1. Visit your Netlify URL
2. Try to log in with seeded credentials
3. Check browser console for API connection issues
4. Test key features:
   - Authentication
   - Dashboard loading
   - API calls

### 4. Configure Custom Domain (Optional)

**In Netlify:**
1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Follow DNS configuration instructions

## ⚡ Optimization Tips

### 1. Enable Netlify Build Plugins

Add useful plugins in `netlify.toml`:

```toml
[[plugins]]
  package = "@netlify/plugin-lighthouse"

[[plugins]]
  package = "netlify-plugin-cache-nextjs"
```

### 2. Configure Caching

Update `netlify.toml`:

```toml
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 3. Enable Asset Optimization

In Netlify Dashboard:
- Go to **Site settings** → **Build & deploy** → **Asset optimization**
- Enable CSS, JavaScript, and image optimization

## 🔍 Troubleshooting

### Issue: "Module not found" errors

**Solution**: Ensure the build command includes building the shared package:

```bash
cd ../shared && pnpm install && pnpm build && cd ../frontend && pnpm install && pnpm build
```

### Issue: API calls failing (CORS errors)

**Solution**: Configure CORS in your backend:

```typescript
// packages/backend/src/main.ts
app.enableCors({
  origin: ['https://your-netlify-site.netlify.app', 'https://yourdomain.com'],
  credentials: true,
});
```

### Issue: Build timeout

**Solution**: 
1. Increase build timeout in Netlify settings (up to 30 minutes on free tier)
2. Optimize build by caching dependencies

### Issue: Environment variables not working

**Solution**:
1. Ensure `NEXT_PUBLIC_` prefix for client-side variables
2. Redeploy after changing environment variables
3. Clear Netlify cache: **Deploys** → **Trigger deploy** → **Clear cache and deploy**

### Issue: 404 on page refresh

**Solution**: Next.js requires proper routing configuration. Add to `netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 📊 Monitoring

### Netlify Analytics (Paid)

For $9/month, get:
- Page views
- Top pages
- Top sources
- Bandwidth usage

### Free Alternatives

1. **Google Analytics**: Add tracking code to your Next.js app
2. **Vercel Analytics**: Free alternative with better Next.js integration
3. **Plausible**: Privacy-friendly analytics

## 🔄 Continuous Deployment

Netlify automatically deploys when you push to your main branch:

1. Make changes locally
2. Commit: `git commit -m "your changes"`
3. Push: `git push origin main`
4. Netlify automatically builds and deploys

### Deploy Previews

Netlify creates preview deployments for pull requests:
- Each PR gets a unique preview URL
- Test changes before merging
- Automatic cleanup when PR is closed

## 💡 Cost Optimization Tips

### Stay Within Free Tier Limits

1. **Optimize images**: Use Next.js Image component
2. **Enable caching**: Reduce bandwidth usage
3. **Lazy load components**: Faster page loads
4. **Monitor bandwidth**: Check Netlify dashboard regularly

### When to Upgrade

Consider upgrading to Netlify Pro ($19/month) if you need:
- More than 100 GB bandwidth
- Team collaboration features
- Better support
- Advanced deployment features

## 🎯 Complete Deployment Checklist

- [ ] Backend deployed and running
- [ ] Database created and migrated
- [ ] Backend environment variables configured
- [ ] Netlify account created
- [ ] Repository connected to Netlify
- [ ] Build settings configured
- [ ] Frontend environment variables set
- [ ] First deployment successful
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Test authentication flow
- [ ] Test all major features
- [ ] Set up monitoring/analytics
- [ ] Document deployment process for team

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [NestJS Production Guide](https://docs.nestjs.com/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)

## 🆘 Getting Help

If you encounter issues:

1. Check [Netlify Support Forums](https://answers.netlify.com/)
2. Review [Netlify Status](https://www.netlifystatus.com/)
3. Check build logs in Netlify Dashboard
4. Review backend logs in your hosting platform
5. Open an issue in this repository

---

**Built with ❤️ - Happy Deploying!**
