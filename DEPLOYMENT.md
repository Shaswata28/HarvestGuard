# Deployment Guide

This guide covers different deployment strategies for your full-stack application.

## 🚀 Quick Start: Deploy to Render

**Recommended for most users**. See [RENDER-DEPLOYMENT.md](./RENDER-DEPLOYMENT.md) for detailed Render-specific instructions.

**Quick Deploy**:
1. Push your code to GitHub
2. Connect to Render
3. Use build command: `pnpm install && pnpm build:fullstack`
4. Use start command: `pnpm start:fullstack`
5. Add environment variables
6. Deploy!

---

## Deployment Strategies

### Strategy 1: Full-Stack Deployment (Single Server)

Deploy both frontend and backend together on a single platform.

**Best for**: Railway, Render, Heroku, DigitalOcean App Platform

**Build Command**:
```bash
pnpm build:fullstack
# or
npm run build:fullstack
```

**Start Command**:
```bash
pnpm start:fullstack
# or
npm run start:fullstack
```

**Environment Variables Required**:
- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENWEATHER_API_KEY` - OpenWeather API key
- `NODE_ENV=production`

**Platforms**:

#### Railway
1. Connect your GitHub repository
2. Set build command: `pnpm build:fullstack`
3. Set start command: `pnpm start:fullstack`
4. Add environment variables
5. Deploy

#### Render
1. Create new Web Service
2. Build command: `pnpm install && pnpm build:fullstack`
3. Start command: `pnpm start:fullstack`
4. Add environment variables
5. Deploy

---

### Strategy 2: Separate Frontend & Backend Deployment

Deploy frontend on a CDN/static host and backend on a server platform.

**Best for**: 
- Frontend: Netlify, Vercel, Cloudflare Pages
- Backend: Railway, Render, Fly.io

#### Frontend Deployment

**Build Command**:
```bash
pnpm build:client
# or
npm run build:client
```

**Output Directory**: `dist/spa`

**Environment Variables** (build-time):
- `VITE_API_URL` - Your backend API URL (e.g., `https://api.yourdomain.com`)

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  command = "pnpm install && pnpm build:client"
  publish = "dist/spa"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "pnpm install && pnpm build:client",
  "outputDirectory": "dist/spa",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Backend Deployment (API Only)

**Build Command**:
```bash
pnpm build:api
# or
npm run build:api
```

**Start Command**:
```bash
pnpm start:api
# or
npm run start:api
```

**Environment Variables Required**:
- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENWEATHER_API_KEY` - OpenWeather API key
- `NODE_ENV=production`
- `CORS_ORIGIN` - Your frontend URL (e.g., `https://yourdomain.com`)

**Railway/Render**:
1. Create new Web Service
2. Build command: `pnpm install && pnpm build:api`
3. Start command: `pnpm start:api`
4. Add environment variables
5. Deploy

---

## CORS Configuration for Separate Deployment

When deploying frontend and backend separately, you need to configure CORS properly.

Update `server/index.ts` to use the `CORS_ORIGIN` environment variable:

```typescript
import cors from 'cors';

const app = express();

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:8080';
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
```

---

## Frontend API Configuration

When deploying separately, update your frontend to use the backend API URL.

Create a `.env.production` file in your project root:

```env
VITE_API_URL=https://your-api-domain.com
```

Update `client/services/api.ts` to use this:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Use API_BASE_URL in your fetch calls
fetch(`${API_BASE_URL}/api/endpoint`)
```

---

## Quick Reference

| Deployment Type | Build Command | Start Command | Output |
|----------------|---------------|---------------|---------|
| Full-Stack | `pnpm build:fullstack` | `pnpm start:fullstack` | `dist/server/` + `dist/spa/` |
| Frontend Only | `pnpm build:client` | N/A (static) | `dist/spa/` |
| Backend Only | `pnpm build:api` | `pnpm start:api` | `dist/api/` |

---

## Testing Locally

### Test Full-Stack Build
```bash
pnpm build:fullstack
pnpm start:fullstack
# Visit http://localhost:3000
```

### Test Separate Builds
```bash
# Terminal 1 - Backend
pnpm build:api
pnpm start:api
# API runs on http://localhost:3000

# Terminal 2 - Frontend (preview)
pnpm build:client
pnpm preview:client
# Frontend runs on http://localhost:8080
```

---

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGIN` is set correctly on backend
- Check that frontend is using correct `VITE_API_URL`

### API Not Found (404)
- Verify API URL is correct in frontend
- Check backend is running and accessible
- Ensure all API routes start with `/api/`

### Build Failures
- Run `pnpm typecheck` to check for TypeScript errors
- Ensure all environment variables are set
- Check build logs for specific errors

### Database Connection Issues
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access settings
- Ensure IP whitelist includes your deployment platform
