# Deployment Configuration Changes

This document summarizes all changes made to support separate frontend and backend deployment.

## Files Created

### 1. `server/api-only.ts`
- New entry point for API-only backend deployment
- Does not serve static frontend files
- Includes health check endpoint
- Suitable for deploying backend separately

### 2. `vite.config.server-api.ts`
- Vite configuration for building API-only backend
- Outputs to `dist/api/` directory
- Excludes frontend serving logic

### 3. `DEPLOYMENT.md`
- Comprehensive deployment guide
- Covers both full-stack and separate deployment strategies
- Platform-specific instructions (Railway, Render, Netlify, Vercel)
- CORS configuration guide
- Troubleshooting section

### 4. `DEPLOYMENT-QUICK-START.md`
- Quick reference for deployment commands
- Platform-specific command examples
- Common issues and solutions

### 5. `.env.production.example`
- Example production environment variables
- Includes all required configuration
- CORS_ORIGIN configuration for separate deployment

### 6. `.env.frontend.example`
- Frontend-specific environment variables
- VITE_API_URL configuration for separate deployment

## Files Modified

### 1. `package.json`
Added new scripts:
- `build:api` - Build backend only (API server)
- `build:fullstack` - Build both frontend and backend (existing functionality)
- `build:separate` - Build both but for separate deployment
- `start:fullstack` - Start full-stack server
- `start:api` - Start API-only server
- `preview:client` - Preview built frontend locally

### 2. `server/index.ts`
Updated CORS configuration:
- Now supports `CORS_ORIGIN` environment variable
- Defaults to `*` for development
- Can be set to specific domain for production

### 3. `README.md`
Updated deployment section:
- Added information about deployment strategies
- Links to detailed deployment guides
- Environment variable requirements

## Deployment Strategies

### Strategy 1: Full-Stack (Single Server)
**Commands**:
```bash
pnpm build:fullstack
pnpm start:fullstack
```

**Use Cases**:
- Railway, Render, Heroku
- Simple deployment
- Single domain

### Strategy 2: Separate Frontend & Backend
**Frontend Commands**:
```bash
pnpm build:client
# Deploy dist/spa/ to Netlify/Vercel
```

**Backend Commands**:
```bash
pnpm build:api
pnpm start:api
```

**Use Cases**:
- CDN for frontend (Netlify, Vercel, Cloudflare Pages)
- Dedicated backend server (Railway, Render, Fly.io)
- Better scalability
- Separate domains

## Environment Variables

### Backend (Both Strategies)
- `PORT` - Server port
- `NODE_ENV` - Environment (production)
- `MONGODB_URI` - Database connection
- `GEMINI_API_KEY` - Gemini API key
- `OPENWEATHER_API_KEY` - Weather API key

### Backend (Separate Deployment Only)
- `CORS_ORIGIN` - Frontend URL (e.g., https://yourdomain.com)

### Frontend (Separate Deployment Only)
- `VITE_API_URL` - Backend API URL (e.g., https://api.yourdomain.com)

## Testing Changes Locally

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
# API on http://localhost:3000

# Terminal 2 - Frontend
pnpm build:client
pnpm preview:client
# Frontend on http://localhost:8080
```

## Migration Guide

### From Current Setup to Separate Deployment

1. **Backend Deployment**:
   - Use `build:api` instead of `build:server`
   - Use `start:api` instead of `start:fullstack`
   - Add `CORS_ORIGIN` environment variable

2. **Frontend Deployment**:
   - Use `build:client` (no change)
   - Deploy `dist/spa/` directory
   - Add `VITE_API_URL` environment variable

3. **Update API Calls** (if needed):
   - Ensure frontend uses `VITE_API_URL` for API calls
   - Update `client/services/api.ts` if necessary

## Backward Compatibility

All existing commands still work:
- `pnpm dev` - Development mode (unchanged)
- `pnpm build` - Builds both (unchanged)
- `pnpm start` - Starts full-stack server (unchanged)

The new commands are additions, not replacements.

## Next Steps

1. Choose your deployment strategy
2. Set up environment variables on your platform
3. Configure build and start commands
4. Deploy!

For detailed instructions, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Comprehensive guide
- [DEPLOYMENT-QUICK-START.md](./DEPLOYMENT-QUICK-START.md) - Quick reference
