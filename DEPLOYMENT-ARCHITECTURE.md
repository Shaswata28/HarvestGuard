# Deployment Architecture

Visual guide to understanding the deployment options.

## Option 1: Full-Stack Deployment (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│                    Render Web Service                    │
│                  (your-app.onrender.com)                 │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Node.js Server (Port 3000)            │ │
│  │                                                    │ │
│  │  ┌──────────────────┐  ┌─────────────────────┐  │ │
│  │  │  Express Backend │  │  Static Frontend    │  │ │
│  │  │                  │  │  (React SPA)        │  │ │
│  │  │  /api/*          │  │  /*                 │  │ │
│  │  │                  │  │                     │  │ │
│  │  │  - /api/health   │  │  - index.html       │  │ │
│  │  │  - /api/farmers  │  │  - assets/          │  │ │
│  │  │  - /api/weather  │  │  - React Router     │  │ │
│  │  │  - /api/scanner  │  │                     │  │ │
│  │  └──────────────────┘  └─────────────────────┘  │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
                           │
                           │ MongoDB Connection
                           ▼
                  ┌─────────────────┐
                  │  MongoDB Atlas  │
                  │   (Database)    │
                  └─────────────────┘
                           │
                           │ External APIs
                           ▼
          ┌────────────────────────────────┐
          │  - OpenWeatherMap API          │
          │  - Google Gemini API           │
          └────────────────────────────────┘
```

### Characteristics

- **Single Service**: One Render web service
- **Single Domain**: `https://your-app.onrender.com`
- **Simple Setup**: Easiest to configure and maintain
- **Cost**: Free tier available (1 service)
- **Best For**: Most use cases, MVP, small to medium apps

### Build & Deploy

```bash
Build:  pnpm install && pnpm build:fullstack
Start:  pnpm start:fullstack
Output: dist/server/ + dist/spa/
```

---

## Option 2: Separate Frontend & Backend

```
┌──────────────────────────────────────┐
│     Render Static Site (Frontend)    │
│   (your-frontend.onrender.com)       │
│                                      │
│  ┌────────────────────────────────┐ │
│  │      Static Files (CDN)        │ │
│  │                                │ │
│  │  - index.html                  │ │
│  │  - assets/                     │ │
│  │  - React SPA                   │ │
│  │  - Client-side routing         │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
                │
                │ API Calls (CORS)
                │ VITE_API_URL
                ▼
┌──────────────────────────────────────┐
│   Render Web Service (Backend API)   │
│     (your-api.onrender.com)          │
│                                      │
│  ┌────────────────────────────────┐ │
│  │     Express API Server         │ │
│  │                                │ │
│  │  - /health                     │ │
│  │  - /api/farmers                │ │
│  │  - /api/weather                │ │
│  │  - /api/scanner                │ │
│  │  - CORS enabled                │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
                │
                │ MongoDB Connection
                ▼
       ┌─────────────────┐
       │  MongoDB Atlas  │
       │   (Database)    │
       └─────────────────┘
                │
                │ External APIs
                ▼
   ┌────────────────────────────────┐
   │  - OpenWeatherMap API          │
   │  - Google Gemini API           │
   └────────────────────────────────┘
```

### Characteristics

- **Two Services**: Static site + Web service
- **Two Domains**: 
  - Frontend: `https://your-frontend.onrender.com`
  - Backend: `https://your-api.onrender.com`
- **CORS Required**: Must configure cross-origin requests
- **Cost**: Free tier available (both services free)
- **Best For**: High traffic, CDN benefits, separate scaling

### Build & Deploy

**Frontend**:
```bash
Build:  pnpm install && pnpm build:client
Output: dist/spa/
Deploy: Render Static Site
Env:    VITE_API_URL=https://your-api.onrender.com
```

**Backend**:
```bash
Build:  pnpm install && pnpm build:api
Start:  pnpm start:api
Output: dist/api/
Deploy: Render Web Service
Env:    CORS_ORIGIN=https://your-frontend.onrender.com
```

---

## Request Flow Comparison

### Full-Stack Deployment

```
User Browser
    │
    │ https://your-app.onrender.com/
    ▼
┌─────────────────────────────┐
│   Render Web Service        │
│                             │
│   GET /                     │──▶ Serve index.html
│   GET /dashboard            │──▶ Serve index.html (SPA routing)
│   GET /api/weather          │──▶ Express API handler
│   GET /assets/main.js       │──▶ Serve static file
│                             │
└─────────────────────────────┘
```

### Separate Deployment

```
User Browser
    │
    │ https://your-frontend.onrender.com/
    ▼
┌─────────────────────────────┐
│   Render Static Site        │
│                             │
│   GET /                     │──▶ Serve index.html
│   GET /dashboard            │──▶ Serve index.html (SPA routing)
│   GET /assets/main.js       │──▶ Serve static file
│                             │
└─────────────────────────────┘
    │
    │ fetch('https://your-api.onrender.com/api/weather')
    ▼
┌─────────────────────────────┐
│   Render Web Service (API)  │
│                             │
│   GET /api/weather          │──▶ Express API handler
│   (CORS headers added)      │
│                             │
└─────────────────────────────┘
```

---

## Environment Variables Flow

### Full-Stack

```
Render Dashboard
    │
    │ Set Environment Variables
    ▼
┌─────────────────────────────────────┐
│  NODE_ENV=production                │
│  MONGODB_URI=mongodb+srv://...      │
│  GEMINI_API_KEY=...                 │
│  OPENWEATHER_API_KEY=...            │
│  CORS_ORIGIN=*                      │
└─────────────────────────────────────┘
    │
    │ Available to Node.js process
    ▼
┌─────────────────────────────────────┐
│  Express Server                     │
│  - process.env.MONGODB_URI          │
│  - process.env.GEMINI_API_KEY       │
└─────────────────────────────────────┘
```

### Separate Deployment

**Frontend**:
```
Render Dashboard (Static Site)
    │
    │ Set Build-time Variables
    ▼
┌─────────────────────────────────────┐
│  VITE_API_URL=https://api.domain... │
└─────────────────────────────────────┘
    │
    │ Embedded in build
    ▼
┌─────────────────────────────────────┐
│  Built JavaScript                   │
│  - import.meta.env.VITE_API_URL     │
└─────────────────────────────────────┘
```

**Backend**:
```
Render Dashboard (Web Service)
    │
    │ Set Runtime Variables
    ▼
┌─────────────────────────────────────┐
│  NODE_ENV=production                │
│  MONGODB_URI=mongodb+srv://...      │
│  GEMINI_API_KEY=...                 │
│  OPENWEATHER_API_KEY=...            │
│  CORS_ORIGIN=https://frontend...    │
└─────────────────────────────────────┘
    │
    │ Available to Node.js process
    ▼
┌─────────────────────────────────────┐
│  Express Server                     │
│  - process.env.MONGODB_URI          │
│  - process.env.CORS_ORIGIN          │
└─────────────────────────────────────┘
```

---

## Scaling Comparison

### Full-Stack

```
Traffic Increase
    │
    ▼
┌─────────────────────────────────────┐
│  Scale Entire Service               │
│  (Frontend + Backend together)      │
│                                     │
│  Pros:                              │
│  - Simple scaling                   │
│  - No CORS complexity               │
│                                     │
│  Cons:                              │
│  - Scale both even if only one      │
│    needs more resources             │
└─────────────────────────────────────┘
```

### Separate

```
Traffic Increase
    │
    ├─▶ Frontend Traffic
    │   │
    │   ▼
    │   ┌──────────────────────────┐
    │   │  Scale Static Site       │
    │   │  (CDN handles this)      │
    │   └──────────────────────────┘
    │
    └─▶ API Traffic
        │
        ▼
        ┌──────────────────────────┐
        │  Scale API Service       │
        │  (Independent scaling)   │
        └──────────────────────────┘

Pros:
- Scale independently
- CDN for static files
- Better for high traffic

Cons:
- More complex setup
- CORS configuration
- Two services to manage
```

---

## Decision Matrix

| Factor | Full-Stack | Separate |
|--------|-----------|----------|
| **Setup Complexity** | ⭐ Simple | ⭐⭐⭐ Complex |
| **Maintenance** | ⭐ Easy | ⭐⭐⭐ Moderate |
| **Cost (Free Tier)** | 1 service | 2 services (both free) |
| **Performance** | ⭐⭐ Good | ⭐⭐⭐ Better (CDN) |
| **Scalability** | ⭐⭐ Good | ⭐⭐⭐ Excellent |
| **CORS Issues** | ✅ None | ⚠️ Must configure |
| **Best For** | MVP, Small-Medium | High traffic, Production |

---

## Recommendation

### Start with Full-Stack

For most projects, especially when starting out:

✅ **Use Full-Stack Deployment**
- Simpler setup and maintenance
- No CORS complexity
- Single service to manage
- Easier debugging
- Free tier sufficient

### Migrate to Separate Later

Consider separate deployment when:
- Traffic increases significantly
- Need independent scaling
- Want CDN benefits for static files
- Have dedicated DevOps resources

---

## Migration Path

If you start with full-stack and want to migrate:

1. **Deploy Backend Separately**
   ```bash
   pnpm build:api
   pnpm start:api
   ```

2. **Update Frontend Build**
   - Add `VITE_API_URL` environment variable
   - Rebuild: `pnpm build:client`

3. **Deploy Frontend to Static Site**
   - Use `dist/spa/` directory

4. **Update CORS**
   - Set `CORS_ORIGIN` on backend

5. **Test & Switch**
   - Verify everything works
   - Update DNS if using custom domain

---

For implementation details, see:
- [RENDER-DEPLOYMENT.md](./RENDER-DEPLOYMENT.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
