# Render Deployment Quick Reference Card

Print this page for quick reference during deployment.

---

## 🚀 Full-Stack Deployment (Recommended)

### Render Configuration

| Setting | Value |
|---------|-------|
| **Service Type** | Web Service |
| **Runtime** | Node |
| **Build Command** | `pnpm install && pnpm build:fullstack` |
| **Start Command** | `pnpm start:fullstack` |
| **Health Check** | `/api/health` |

### Required Environment Variables

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DB_NAME=HarvestGuard
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
```

### Optional Environment Variables

```env
WEATHER_CACHE_TTL=3600
WEATHER_CACHE_EXTENDED_TTL=7200
WEATHER_API_DAILY_LIMIT=1000
WEATHER_API_WARNING_THRESHOLD=800
CORS_ORIGIN=*
```

---

## 🌐 Separate Deployment

### Backend Service

| Setting | Value |
|---------|-------|
| **Service Type** | Web Service |
| **Runtime** | Node |
| **Build Command** | `pnpm install && pnpm build:api` |
| **Start Command** | `pnpm start:api` |
| **Health Check** | `/health` |

**Environment Variables**: Same as full-stack, plus:
```env
CORS_ORIGIN=https://your-frontend.onrender.com
```

### Frontend Service

| Setting | Value |
|---------|-------|
| **Service Type** | Static Site |
| **Build Command** | `pnpm install && pnpm build:client` |
| **Publish Directory** | `dist/spa` |

**Environment Variables**:
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## 📋 Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas database created
- [ ] MongoDB user created with permissions
- [ ] MongoDB IP whitelist set to 0.0.0.0/0
- [ ] Gemini API key obtained
- [ ] OpenWeatherMap API key obtained
- [ ] Render account created
- [ ] GitHub connected to Render

---

## ✅ Verification Endpoints

After deployment, test these URLs:

| Endpoint | Expected Response |
|----------|-------------------|
| `/api/health` | `{"status":"ok","timestamp":"..."}` |
| `/api/ping` | `{"message":"pong"}` |
| `/` | Application loads |

---

## 🔧 Common Commands

### Local Testing

```bash
# Test full-stack build
pnpm build:fullstack
pnpm start:fullstack

# Test separate builds
pnpm build:api
pnpm start:api
# (in another terminal)
pnpm build:client
pnpm preview:client
```

### Development

```bash
# Start dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check `pnpm typecheck` locally |
| DB connection fails | Verify MongoDB URI and IP whitelist |
| API returns 404 | Check all routes start with `/api/` |
| CORS errors | Verify `CORS_ORIGIN` matches frontend URL |
| Slow first load | Normal on free tier (cold start) |

---

## 📞 Support Links

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Gemini API**: https://ai.google.dev/docs
- **OpenWeather**: https://openweathermap.org/api

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `RENDER-DEPLOYMENT.md` | Complete deployment guide |
| `RENDER-CHECKLIST.md` | Step-by-step checklist |
| `DEPLOYMENT-QUICK-START.md` | Command reference |
| `DEPLOYMENT-ARCHITECTURE.md` | Architecture diagrams |
| `DEPLOYMENT.md` | General deployment guide |

---

## 🎯 Your Deployment URLs

Fill in after deployment:

**Full-Stack**:
- App URL: `https://_________________.onrender.com`

**Separate**:
- Frontend: `https://_________________.onrender.com`
- Backend: `https://_________________.onrender.com`

**MongoDB**:
- Connection: `mongodb+srv://_________________`

---

## 💡 Pro Tips

1. **Free Tier**: Services sleep after 15 min inactivity
2. **First Request**: May take 30-60 seconds to wake up
3. **Logs**: Check Render dashboard for errors
4. **Updates**: Push to GitHub triggers auto-deploy
5. **Rollback**: Use Render dashboard to rollback
6. **Custom Domain**: Available on paid plans

---

**Last Updated**: November 2024
**Version**: 1.0
