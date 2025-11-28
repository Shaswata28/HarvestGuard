# Render Deployment Checklist

Use this checklist to ensure a smooth deployment to Render.

## Pre-Deployment

### 1. Code Preparation
- [ ] All code committed and pushed to GitHub
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] All tests passing (`npm test`)
- [ ] `.env` file NOT committed (should be in `.gitignore`)

### 2. MongoDB Atlas Setup
- [ ] MongoDB Atlas account created
- [ ] Free cluster created
- [ ] Database user created with read/write permissions
- [ ] Network access set to "Allow from Anywhere" (0.0.0.0/0)
- [ ] Connection string copied (format: `mongodb+srv://user:pass@cluster.mongodb.net/`)

### 3. API Keys
- [ ] Google Gemini API key obtained from [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] OpenWeatherMap API key obtained from [OpenWeatherMap](https://openweathermap.org/api)
- [ ] Both keys tested and working

### 4. Render Account
- [ ] Render account created at [render.com](https://render.com)
- [ ] GitHub account connected to Render

---

## Deployment Steps

### Full-Stack Deployment (Recommended)

#### Step 1: Create Web Service
- [ ] Clicked "New +" → "Web Service" in Render Dashboard
- [ ] Connected GitHub repository
- [ ] Selected correct repository

#### Step 2: Configure Service
- [ ] **Name**: Set to `harvestguard` (or your preferred name)
- [ ] **Region**: Selected (e.g., Oregon)
- [ ] **Branch**: Set to `main` or your default branch
- [ ] **Runtime**: Set to `Node`
- [ ] **Build Command**: `pnpm install && pnpm build:fullstack`
- [ ] **Start Command**: `pnpm start:fullstack`
- [ ] **Plan**: Selected (Free or paid)

#### Step 3: Environment Variables
Add these in the "Advanced" section:

**Required**:
- [ ] `NODE_ENV` = `production`
- [ ] `MONGODB_URI` = `your_mongodb_connection_string`
- [ ] `MONGODB_DB_NAME` = `HarvestGuard`
- [ ] `GEMINI_API_KEY` = `your_gemini_api_key`
- [ ] `OPENWEATHER_API_KEY` = `your_openweather_api_key`

**Optional** (recommended defaults):
- [ ] `WEATHER_CACHE_TTL` = `3600`
- [ ] `WEATHER_CACHE_EXTENDED_TTL` = `7200`
- [ ] `WEATHER_API_DAILY_LIMIT` = `1000`
- [ ] `WEATHER_API_WARNING_THRESHOLD` = `800`
- [ ] `CORS_ORIGIN` = `*`

#### Step 4: Health Check
- [ ] **Health Check Path**: Set to `/api/health`

#### Step 5: Deploy
- [ ] Clicked "Create Web Service"
- [ ] Waiting for build to complete (5-10 minutes)

---

## Post-Deployment Verification

### 1. Check Build Logs
- [ ] Build completed successfully
- [ ] No errors in build logs
- [ ] Service shows as "Live" in Render Dashboard

### 2. Test Endpoints

Visit these URLs (replace `your-service-name` with your actual service name):

- [ ] **Health Check**: `https://your-service-name.onrender.com/api/health`
  - Should return: `{"status":"ok","timestamp":"..."}`

- [ ] **Ping Test**: `https://your-service-name.onrender.com/api/ping`
  - Should return: `{"message":"pong"}` or your custom message

- [ ] **Frontend**: `https://your-service-name.onrender.com`
  - Should load the application homepage

### 3. Check Database Connection

In Render logs, verify you see:
- [ ] `[Server] Database connection established`
- [ ] `✅ Express server initialized and mounted`
- [ ] No MongoDB connection errors

### 4. Test Core Features

- [ ] User registration works
- [ ] User login works
- [ ] Weather data loads
- [ ] Crop management works
- [ ] Dashboard displays correctly

### 5. Monitor Performance

- [ ] Check response times (first request may be slow on free tier)
- [ ] Verify no errors in Render logs
- [ ] Test on mobile device
- [ ] Test in different browsers

---

## Troubleshooting

### If Build Fails

- [ ] Check build logs for specific error
- [ ] Verify `package.json` has correct scripts
- [ ] Try building locally: `npm run build:fullstack`
- [ ] Check Node.js version compatibility

### If Database Connection Fails

- [ ] Verify MongoDB connection string is correct
- [ ] Check MongoDB Atlas IP whitelist (should include 0.0.0.0/0)
- [ ] Verify database user credentials
- [ ] Check database user has correct permissions

### If API Returns Errors

- [ ] Check Render logs for error messages
- [ ] Verify all environment variables are set correctly
- [ ] Test API keys are valid and active
- [ ] Check MongoDB connection is established

### If Frontend Doesn't Load

- [ ] Check if service is "Live" in Render Dashboard
- [ ] Verify build completed successfully
- [ ] Check browser console for errors
- [ ] Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

## Optional: Separate Frontend & Backend

If deploying separately, follow these additional steps:

### Backend Service
- [ ] Created separate web service for API
- [ ] Build command: `pnpm install && pnpm build:api`
- [ ] Start command: `pnpm start:api`
- [ ] Health check path: `/health`
- [ ] All environment variables added
- [ ] Backend URL noted: `https://your-api-name.onrender.com`

### Frontend Service
- [ ] Created static site for frontend
- [ ] Build command: `pnpm install && pnpm build:client`
- [ ] Publish directory: `dist/spa`
- [ ] Environment variable added: `VITE_API_URL` = backend URL
- [ ] Frontend URL noted: `https://your-frontend-name.onrender.com`

### Update CORS
- [ ] Updated backend `CORS_ORIGIN` to frontend URL
- [ ] Redeployed backend service
- [ ] Tested cross-origin requests work

---

## Maintenance

### Regular Tasks
- [ ] Monitor Render logs for errors
- [ ] Check MongoDB Atlas usage
- [ ] Monitor API usage (OpenWeatherMap, Gemini)
- [ ] Review application performance

### Updates
- [ ] Push code changes to GitHub
- [ ] Render auto-deploys (or trigger manual deploy)
- [ ] Verify deployment successful
- [ ] Test updated features

### Backups
- [ ] Set up MongoDB Atlas automated backups
- [ ] Document environment variables securely
- [ ] Keep API keys in secure password manager

---

## Success! 🎉

Your application is now live on Render!

**Next Steps**:
1. Share your app URL with users
2. Monitor logs and performance
3. Consider upgrading to paid plan for production use
4. Set up custom domain (optional)
5. Configure monitoring and alerts

**Your App URL**: `https://your-service-name.onrender.com`

---

## Need Help?

- **Render Docs**: https://render.com/docs
- **Detailed Guide**: See [RENDER-DEPLOYMENT.md](./RENDER-DEPLOYMENT.md)
- **General Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Quick Reference**: See [DEPLOYMENT-QUICK-START.md](./DEPLOYMENT-QUICK-START.md)
