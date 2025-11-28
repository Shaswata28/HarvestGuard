# Deployment Quick Start

## 🚀 Full-Stack Deployment (Single Server)

**Use when**: Deploying to Railway, Render, Heroku, or similar platforms

```bash
# Build
pnpm build:fullstack

# Start
pnpm start:fullstack
```

**Environment Variables**:
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=...
OPENWEATHER_API_KEY=...
```

---

## 🌐 Separate Frontend & Backend Deployment

**Use when**: Frontend on Netlify/Vercel, Backend on Railway/Render

### Frontend (Netlify/Vercel)

```bash
# Build
pnpm build:client

# Output directory: dist/spa
```

**Environment Variables**:
```env
VITE_API_URL=https://your-api-domain.com
```

### Backend (Railway/Render)

```bash
# Build
pnpm build:api

# Start
pnpm start:api
```

**Environment Variables**:
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=...
OPENWEATHER_API_KEY=...
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## 📋 Platform-Specific Commands

### Railway (Full-Stack)
- **Build**: `pnpm install && pnpm build:fullstack`
- **Start**: `pnpm start:fullstack`

### Railway (Backend Only)
- **Build**: `pnpm install && pnpm build:api`
- **Start**: `pnpm start:api`

### Netlify (Frontend Only)
- **Build**: `pnpm install && pnpm build:client`
- **Publish**: `dist/spa`

### Vercel (Frontend Only)
- **Build**: `pnpm install && pnpm build:client`
- **Output**: `dist/spa`

### Render (Full-Stack)
- **Build**: `pnpm install && pnpm build:fullstack`
- **Start**: `pnpm start:fullstack`

### Render (Backend Only)
- **Build**: `pnpm install && pnpm build:api`
- **Start**: `pnpm start:api`

---

## 🧪 Test Locally Before Deploying

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

# Terminal 2 - Frontend
pnpm build:client
pnpm preview:client
```

---

## ⚠️ Common Issues

### CORS Errors (Separate Deployment)
✅ Set `CORS_ORIGIN` on backend to your frontend URL
✅ Set `VITE_API_URL` on frontend to your backend URL

### Build Failures
✅ Run `pnpm typecheck` first
✅ Ensure all environment variables are set
✅ Check Node.js version (18+ required)

### API Not Working
✅ Verify all API routes start with `/api/`
✅ Check backend logs for errors
✅ Test API endpoints directly (e.g., `/api/health`)

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
