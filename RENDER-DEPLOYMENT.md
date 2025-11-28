# Render Deployment Guide

This guide covers deploying HarvestGuard on Render.com with two deployment options.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code must be in a GitHub repository
3. **MongoDB Atlas**: Set up a MongoDB database (free tier available)
4. **API Keys**: 
   - Google Gemini API key
   - OpenWeatherMap API key

---

## Option 1: Full-Stack Deployment (Recommended)

Deploy both frontend and backend together as a single web service.

### Step-by-Step Instructions

#### 1. Connect Your Repository

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository from the list

#### 2. Configure the Service

**Basic Settings**:
- **Name**: `harvestguard` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Oregon)
- **Branch**: `main` (or your default branch)
- **Runtime**: `Node`

**Build & Deploy**:
- **Build Command**: 
  ```bash
  pnpm install && pnpm build:fullstack
  ```
- **Start Command**: 
  ```bash
  pnpm start:fullstack
  ```

**Plan**:
- Select **Free** (or paid plan for better performance)

#### 3. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/` | Your MongoDB connection string |
| `MONGODB_DB_NAME` | `HarvestGuard` | Database name |
| `GEMINI_API_KEY` | `your_gemini_key` | From Google AI Studio |
| `OPENWEATHER_API_KEY` | `your_openweather_key` | From OpenWeatherMap |
| `WEATHER_CACHE_TTL` | `3600` | Optional: Cache duration (seconds) |
| `WEATHER_CACHE_EXTENDED_TTL` | `7200` | Optional: Extended cache duration |
| `WEATHER_API_DAILY_LIMIT` | `1000` | Optional: API call limit |
| `WEATHER_API_WARNING_THRESHOLD` | `800` | Optional: Warning threshold |
| `CORS_ORIGIN` | `*` | Allow all origins (or specify your domain) |

#### 4. Configure Health Check (Optional but Recommended)

- **Health Check Path**: `/api/health`
- This ensures Render knows your service is running correctly

#### 5. Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your application
3. Wait for the build to complete (5-10 minutes first time)
4. Your app will be available at: `https://your-service-name.onrender.com`

### Using Blueprint (Automated)

Alternatively, use the `render.yaml` file for automated deployment:

1. Push `render.yaml` to your repository
2. In Render Dashboard, click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will automatically detect `render.yaml` and configure everything
5. You'll still need to add secret environment variables manually

---

## Option 2: Separate Frontend & Backend

Deploy frontend and backend as separate services for better scalability.

### Backend Service

#### 1. Create Backend Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your repository
3. Configure:

**Basic Settings**:
- **Name**: `harvestguard-api`
- **Region**: Oregon (or preferred)
- **Runtime**: `Node`

**Build & Deploy**:
- **Build Command**: 
  ```bash
  pnpm install && pnpm build:api
  ```
- **Start Command**: 
  ```bash
  pnpm start:api
  ```

**Environment Variables**:
Same as Option 1, but update:
- `CORS_ORIGIN`: `https://your-frontend-url.onrender.com` (update after frontend is deployed)

**Health Check**:
- **Path**: `/health`

#### 2. Deploy Backend

Click **"Create Web Service"** and wait for deployment.

Note your backend URL: `https://harvestguard-api.onrender.com`

### Frontend Service

#### 1. Create Frontend Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect your repository
3. Configure:

**Basic Settings**:
- **Name**: `harvestguard-frontend`
- **Branch**: `main`

**Build Settings**:
- **Build Command**: 
  ```bash
  pnpm install && pnpm build:client
  ```
- **Publish Directory**: 
  ```
  dist/spa
  ```

**Environment Variables**:
- `VITE_API_URL`: `https://harvestguard-api.onrender.com` (your backend URL)

#### 2. Configure Redirects

Render should automatically handle SPA routing, but if needed, create a `_redirects` file:

```
/*    /index.html   200
```

This file should be in your `public/` directory so it gets copied to `dist/spa/`.

#### 3. Deploy Frontend

Click **"Create Static Site"** and wait for deployment.

#### 4. Update Backend CORS

Go back to your backend service and update the `CORS_ORIGIN` environment variable:
- `CORS_ORIGIN`: `https://your-frontend-url.onrender.com`

---

## MongoDB Atlas Setup

### 1. Create Database

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with read/write permissions
4. Get your connection string

### 2. Whitelist Render IPs

**Option A: Allow All IPs** (Easiest for Render)
1. In MongoDB Atlas, go to **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Confirm

**Option B: Whitelist Specific IPs** (More Secure)
1. Find Render's outbound IPs for your region
2. Add each IP to MongoDB Atlas Network Access

### 3. Get Connection String

1. In MongoDB Atlas, click **"Connect"**
2. Choose **"Connect your application"**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Add to Render environment variables as `MONGODB_URI`

---

## API Keys Setup

### Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and add to Render as `GEMINI_API_KEY`

### OpenWeatherMap API Key

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Go to API Keys section
3. Generate a new key (free tier: 1,000 calls/day)
4. Copy and add to Render as `OPENWEATHER_API_KEY`

---

## Post-Deployment

### Verify Deployment

1. **Health Check**: Visit `https://your-app.onrender.com/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Test API**: Visit `https://your-app.onrender.com/api/ping`
   - Should return: `{"message":"pong"}`

3. **Test Frontend**: Visit `https://your-app.onrender.com`
   - Should load the application

### Monitor Logs

1. In Render Dashboard, click on your service
2. Go to **"Logs"** tab
3. Monitor for any errors or issues

### Check Database Connection

Look for this in logs:
```
[Server] Database connection established
✅ Express server initialized and mounted
```

---

## Troubleshooting

### Build Fails

**Error**: `pnpm: command not found`
- **Solution**: Render should auto-detect pnpm from `package.json`. If not, change build command to use npm:
  ```bash
  npm install && npm run build:fullstack
  ```

**Error**: TypeScript errors during build
- **Solution**: Fix TypeScript errors locally first:
  ```bash
  npm run typecheck
  ```

### Database Connection Fails

**Error**: `MongoServerError: bad auth`
- **Solution**: Check MongoDB username/password in connection string

**Error**: `MongooseServerSelectionError`
- **Solution**: 
  1. Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
  2. Check connection string format
  3. Ensure database user has correct permissions

### CORS Errors (Separate Deployment)

**Error**: `Access-Control-Allow-Origin` errors in browser
- **Solution**: 
  1. Verify `CORS_ORIGIN` on backend matches frontend URL exactly
  2. Ensure `VITE_API_URL` on frontend matches backend URL exactly
  3. Check both services are deployed and running

### API Not Working

**Error**: 404 on API endpoints
- **Solution**: 
  1. Verify all API routes start with `/api/`
  2. Check backend logs for errors
  3. Test health endpoint: `/api/health`

### Free Tier Limitations

Render free tier services:
- Spin down after 15 minutes of inactivity
- Take 30-60 seconds to spin back up on first request
- 750 hours/month free (enough for 1 service running 24/7)

**Solutions**:
- Upgrade to paid plan for always-on service
- Use a service like [UptimeRobot](https://uptimerobot.com) to ping your app every 5 minutes
- Accept the cold start delay

---

## Updating Your Deployment

### Automatic Deploys

Render automatically deploys when you push to your connected branch:

1. Make changes locally
2. Commit and push to GitHub
3. Render automatically detects changes and redeploys

### Manual Deploy

1. Go to Render Dashboard
2. Click on your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Rollback

1. Go to your service in Render Dashboard
2. Click **"Events"** tab
3. Find a previous successful deploy
4. Click **"Rollback to this version"**

---

## Cost Optimization

### Free Tier Strategy

- **Full-Stack**: 1 web service (free)
- **Separate**: 1 web service + 1 static site (both free)

### Paid Plans

If you need better performance:
- **Starter**: $7/month - Always on, no cold starts
- **Standard**: $25/month - More resources, better performance

---

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Set specific origin in production (not `*`)
3. **MongoDB**: Use strong passwords, enable IP whitelist
4. **API Keys**: Rotate keys periodically
5. **HTTPS**: Render provides free SSL certificates automatically

---

## Next Steps

1. ✅ Deploy your application
2. ✅ Verify all endpoints work
3. ✅ Test the full user flow
4. 📊 Monitor logs and performance
5. 🔄 Set up automatic backups for MongoDB
6. 📈 Consider upgrading to paid plan for production use

---

## Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com

For application-specific issues, check the main [DEPLOYMENT.md](./DEPLOYMENT.md) guide.
