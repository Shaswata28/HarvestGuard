# HarvestGuard - Agricultural Management System

A production-ready full-stack application for agricultural management with real-time weather integration, crop tracking, and health monitoring.

## Features

- 🌾 **Crop Management**: Track crops from planting to harvest
- 🌤️ **Real-time Weather**: OpenWeatherMap API integration with intelligent caching
- 🏥 **Health Monitoring**: Disease detection and treatment tracking
- 📊 **Dashboard Analytics**: Comprehensive metrics for farmers and admins
- 🌐 **Bilingual Support**: Bengali and English
- 📱 **Offline Support**: Progressive Web App capabilities

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Express + Node.js
- **Database**: MongoDB with geospatial indexing
- **Weather API**: OpenWeatherMap (Free Tier)
- **Testing**: Vitest
- **Package Manager**: PNPM

## Prerequisites

- Node.js 18+ 
- PNPM
- MongoDB Atlas account or local MongoDB instance
- OpenWeatherMap API key (free tier)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd harvest-guard
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

#### MongoDB Configuration

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=HarvestGuard
```

**How to get MongoDB credentials:**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Create a database user with read/write permissions
4. Get your connection string from the "Connect" button
5. Replace `username` and `password` with your credentials

#### OpenWeatherMap API Configuration

```env
OPENWEATHER_API_KEY=your_api_key_here
WEATHER_CACHE_TTL=3600
WEATHER_CACHE_EXTENDED_TTL=7200
WEATHER_API_DAILY_LIMIT=1000
WEATHER_API_WARNING_THRESHOLD=800
```

**How to get OpenWeatherMap API key:**
1. Sign up for a free account at [OpenWeatherMap](https://openweathermap.org/api)
2. Navigate to API Keys section in your account
3. Generate a new API key (free tier: 1,000 calls/day)
4. Copy the API key to your `.env` file

**Weather Configuration Options:**
- `WEATHER_CACHE_TTL`: Cache duration in seconds (default: 3600 = 1 hour)
- `WEATHER_CACHE_EXTENDED_TTL`: Extended cache when approaching API limits (default: 7200 = 2 hours)
- `WEATHER_API_DAILY_LIMIT`: Maximum API calls per day (default: 1000 for free tier)
- `WEATHER_API_WARNING_THRESHOLD`: Warning threshold percentage (default: 800 = 80%)

### 4. Run the application

Development mode (with hot reload):

```bash
pnpm dev
```

The application will be available at `http://localhost:8080`

### 5. Run tests

```bash
pnpm test
```

Type checking:

```bash
pnpm typecheck
```

## Project Structure

```
├── client/                 # React frontend
│   ├── pages/             # Route components
│   ├── components/        # Reusable UI components
│   ├── context/           # React context providers
│   └── utils/             # Client utilities
├── server/                # Express backend
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic layer
│   ├── db/                # Database layer
│   │   ├── repositories/  # Data access layer
│   │   └── schemas/       # MongoDB schemas
│   ├── middleware/        # Express middleware
│   └── utils/             # Server utilities
├── shared/                # Shared types between client/server
└── .env                   # Environment configuration
```

## API Endpoints

### Weather API

- `GET /api/weather/current?farmerId={id}` - Get current weather for farmer's location
- `GET /api/weather/forecast?farmerId={id}` - Get 7-day weather forecast
- `GET /api/weather/location?lat={lat}&lon={lon}` - Get weather for specific coordinates
- `GET /api/weather/usage` - Get API usage statistics

### Farmers API

- `POST /api/farmers/register` - Register new farmer
- `POST /api/farmers/login` - Farmer login
- `GET /api/farmers/:id` - Get farmer profile
- `PUT /api/farmers/:id` - Update farmer profile

### Crop Batches API

- `POST /api/crop-batches` - Create new crop batch
- `GET /api/crop-batches` - List crop batches
- `GET /api/crop-batches/:id` - Get crop batch details
- `PUT /api/crop-batches/:id` - Update crop batch
- `POST /api/crop-batches/:id/transition` - Transition crop stage

### Dashboard API

- `GET /api/dashboard/farmer/:farmerId` - Get farmer dashboard metrics
- `GET /api/dashboard/admin` - Get admin dashboard metrics

## Weather Integration

The application uses OpenWeatherMap API with intelligent caching to stay within free tier limits:

### Caching Strategy

- **Cache Duration**: 1 hour (configurable)
- **Cache Key**: Location coordinates rounded to 2 decimal places (~1km precision)
- **Shared Cache**: Multiple farmers in the same area share cached data
- **Automatic Extension**: Cache TTL extends to 2 hours when approaching API limits
- **Fallback**: Returns stale cache if API fails

### API Usage Monitoring

The system tracks API usage and provides warnings:

- Logs warning at 80% of daily limit (800 calls)
- Automatically extends cache TTL when approaching limits
- Usage statistics available via `/api/weather/usage` endpoint

### Location Mapping

Bangladesh locations (divisions, districts, upazilas) are mapped to coordinates:

- Precise coordinates for major upazilas
- District-level fallback when upazila not found
- Default location (Dhaka) when mapping fails

## Troubleshooting

### Weather API Issues

**Problem**: Weather data not loading

**Solutions**:
1. Verify `OPENWEATHER_API_KEY` is set correctly in `.env`
2. Check API key is activated (can take a few hours after creation)
3. Verify you haven't exceeded daily API limit (1,000 calls)
4. Check browser console and server logs for error messages

**Problem**: "API key invalid" error

**Solutions**:
1. Ensure API key is copied correctly without extra spaces
2. Wait a few hours if key was just created
3. Generate a new API key from OpenWeatherMap dashboard

### Database Issues

**Problem**: Cannot connect to MongoDB

**Solutions**:
1. Verify `MONGODB_URI` is correct in `.env`
2. Check database user has proper permissions
3. Ensure your IP address is whitelisted in MongoDB Atlas
4. Verify network connectivity

**Problem**: Geospatial queries failing

**Solutions**:
1. Ensure database indexes are created (run `pnpm dev` to initialize)
2. Check MongoDB version supports 2dsphere indexes (4.0+)
3. Verify location data format is correct (GeoJSON Point)

### General Issues

**Problem**: Application not starting

**Solutions**:
1. Run `pnpm install` to ensure all dependencies are installed
2. Check Node.js version (18+ required)
3. Verify all required environment variables are set
4. Check for port conflicts (default: 8080)

**Problem**: TypeScript errors

**Solutions**:
1. Run `pnpm typecheck` to see all errors
2. Ensure all dependencies are installed
3. Check for version mismatches in `package.json`

## Production Deployment

### 🚀 Deploy to Render (Recommended)

The easiest way to deploy HarvestGuard is using Render.com:

**Quick Deploy Steps**:
1. Push your code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Connect your repository
4. Use these commands:
   - **Build**: `pnpm install && pnpm build:fullstack`
   - **Start**: `pnpm start:fullstack`
5. Add environment variables (see below)
6. Deploy!

**Detailed Guides**:
- 📖 [Complete Render Guide](./RENDER-DEPLOYMENT.md) - Step-by-step instructions
- ✅ [Deployment Checklist](./RENDER-CHECKLIST.md) - Don't miss anything
- ⚡ [Quick Reference](./DEPLOYMENT-QUICK-START.md) - Commands at a glance

### Deployment Strategies

This application supports two deployment strategies:

#### Option 1: Full-Stack Deployment (Recommended)

Deploy both frontend and backend together on a single platform.

**Build Command**:
```bash
pnpm build:fullstack
```

**Start Command**:
```bash
pnpm start:fullstack
```

**Best for**: Render, Railway, Heroku, DigitalOcean

#### Option 2: Separate Frontend & Backend

Deploy frontend on a CDN and backend on a server platform.

**Frontend Build**:
```bash
pnpm build:client
```
Output: `dist/spa/` (deploy to Netlify, Vercel, Cloudflare Pages)

**Backend Build**:
```bash
pnpm build:api
```

**Backend Start**:
```bash
pnpm start:api
```

**Best for**: 
- Frontend: Netlify, Vercel, Cloudflare Pages
- Backend: Render, Railway, Fly.io

### Required Environment Variables

Ensure all environment variables are set in your production environment:

**Required**:
- `NODE_ENV` - Set to `production`
- `MONGODB_URI` - Production MongoDB connection string
- `MONGODB_DB_NAME` - Database name (e.g., `HarvestGuard`)
- `OPENWEATHER_API_KEY` - OpenWeatherMap API key
- `GEMINI_API_KEY` - Google Gemini API key

**Optional** (with defaults):
- `WEATHER_CACHE_TTL` - Cache duration in seconds (default: 3600)
- `WEATHER_CACHE_EXTENDED_TTL` - Extended cache duration (default: 7200)
- `WEATHER_API_DAILY_LIMIT` - API call limit (default: 1000)
- `WEATHER_API_WARNING_THRESHOLD` - Warning threshold (default: 800)
- `CORS_ORIGIN` - Frontend URL for separate deployment (default: `*`)

### All Deployment Guides

- 📑 [Deployment Index](./DEPLOYMENT-INDEX.md) - **Complete documentation guide**
- 🎯 [Render Deployment](./RENDER-DEPLOYMENT.md) - **Recommended platform**
- ✅ [Render Checklist](./RENDER-CHECKLIST.md) - Step-by-step checklist
- 📖 [Quick Reference](./RENDER-QUICK-REFERENCE.md) - One-page reference card
- 📚 [General Deployment](./DEPLOYMENT.md) - All platforms
- ⚡ [Quick Commands](./DEPLOYMENT-QUICK-START.md) - Command reference
- 🏗️ [Architecture Guide](./DEPLOYMENT-ARCHITECTURE.md) - Visual diagrams

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review server logs for error messages
- Check browser console for client-side errors
- Open an issue on GitHub

## Acknowledgments

- OpenWeatherMap for weather data API
- MongoDB Atlas for database hosting
- React and Vite communities for excellent tooling
