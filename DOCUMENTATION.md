# HarvestGuard - Complete Documentation

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)

**HarvestGuard** is a full-stack agricultural management platform designed to help farmers in Bangladesh reduce post-harvest losses through real-time insights, AI-powered crop disease detection, offline-first capabilities, and bilingual support (English/Bengali).

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Installation & Setup](#installation--setup)
7. [Configuration](#configuration)
8. [Development](#development)
9. [API Documentation](#api-documentation)
10. [Database Schema](#database-schema)
11. [Frontend Architecture](#frontend-architecture)
12. [Backend Architecture](#backend-architecture)
13. [AI & External Services](#ai--external-services)
14. [Offline Capabilities](#offline-capabilities)
15. [Internationalization](#internationalization)
16. [Testing](#testing)
17. [Deployment](#deployment)
18. [Security](#security)
19. [Performance Optimization](#performance-optimization)
20. [Troubleshooting](#troubleshooting)
21. [Contributing](#contributing)
22. [License](#license)

---

## Overview

HarvestGuard addresses the critical issue of post-harvest food loss in Bangladesh, where approximately 4.5 million tonnes of grain are lost annually due to poor storage and lack of timely information. The platform provides:

- **Smart Crop Management**: Track crops from planting to harvest
- **AI Disease Detection**: Upload crop images for instant diagnosis using Google Gemini
- **Weather Intelligence**: Hyper-local forecasts with farming advisories
- **Offline-First PWA**: Full functionality without constant internet connectivity
- **Bilingual Support**: Complete English and Bengali (বাংলা) localization


---

## Key Features

### For Farmers

#### 1. Crop Lifecycle Management
- Track crops from sowing to harvest
- Record estimated and actual yields
- Monitor storage locations and conditions
- Calculate loss percentages automatically
- Generate batch numbers for inventory tracking

#### 2. AI-Powered Disease Detection
- Upload crop images via camera or gallery
- Instant disease diagnosis using Google Gemini AI
- Confidence scores and severity ratings
- Treatment recommendations in local language
- Disease history tracking

#### 3. Weather Intelligence
- Real-time weather data from OpenWeatherMap
- 5-day forecast with hourly breakdowns
- Location-based weather for Bangladesh divisions/districts
- Intelligent caching to minimize API calls
- Farming advisories based on weather conditions:
  - Heat stress warnings (>35°C)
  - Heavy rainfall alerts (>50mm)
  - High humidity warnings (>80%)
  - Strong wind alerts (>10 m/s)

#### 4. Dashboard & Analytics
- Visual crop inventory overview
- Growing vs harvested crop statistics
- Loss tracking and analysis
- Intervention success rates
- Achievement badges system

#### 5. Offline-First PWA
- Service worker for offline caching
- Local storage for crop data
- Automatic sync when online
- Works without constant connectivity
- Installable on mobile devices

#### 6. Bilingual Interface
- Complete English and Bengali support
- Context-aware translations
- Language switcher in navigation
- Localized date/time formats

### For Administrators

#### 1. Admin Dashboard
- Total farmers and crop batches overview
- Loss event tracking and analysis
- Intervention success monitoring
- Geographic loss distribution
- Real-time statistics

#### 2. Data Analytics
- Loss by type and location
- Intervention effectiveness
- Storage method comparisons
- Temporal loss patterns

---

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 3 with Shadcn/UI components
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Animations**: Framer Motion
- **3D Graphics**: Three.js with React Three Fiber
- **Icons**: Lucide React
- **Theming**: next-themes for dark mode support

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Language**: TypeScript
- **Validation**: Zod schemas
- **Image Processing**: Sharp
- **File Upload**: Multer
- **Authentication**: bcrypt for password hashing

### Database
- **Database**: MongoDB Atlas
- **Driver**: Official MongoDB Node.js driver
- **Features**: Geospatial indexing, TTL indexes, compound indexes

### AI & External APIs
- **AI**: Google Gemini 2.5 Flash for image analysis
- **Weather**: OpenWeatherMap API (Current + Forecast)

### DevOps & Tools
- **Package Manager**: PNPM 10
- **Testing**: Vitest with Supertest
- **Code Quality**: Prettier, TypeScript strict mode
- **Deployment**: Render, Netlify, Docker support


---

## Architecture

### System Architecture

HarvestGuard follows a **monorepo architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  React SPA + PWA (Vite, TailwindCSS, Shadcn/UI)            │
│  - Offline Storage (IndexedDB/LocalStorage)                 │
│  - Service Worker for caching                               │
│  - TanStack Query for data fetching                         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────────────┐
│                      Server Layer                            │
│  Express.js + TypeScript                                     │
│  - Route handlers                                            │
│  - Middleware (validation, error handling)                   │
│  - Business logic services                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼────────────┐
│   MongoDB    │ │ Gemini  │ │ OpenWeather   │
│   Atlas      │ │   AI    │ │     API       │
│              │ │         │ │               │
│ - Farmers    │ │ Image   │ │ Current +     │
│ - Crops      │ │ Analysis│ │ Forecast      │
│ - Scans      │ │         │ │               │
│ - Weather    │ │         │ │               │
└──────────────┘ └─────────┘ └───────────────┘
```

### Deployment Architectures

#### Option 1: Full-Stack Single Deployment
```
Render/Heroku
├── Express Server (serves API + static files)
└── MongoDB Atlas (cloud database)
```

#### Option 2: Separate Frontend/Backend
```
Frontend: Netlify/Vercel (static hosting)
Backend: Render/Railway (Node.js server)
Database: MongoDB Atlas
```

### Data Flow

1. **User Action** → React component
2. **API Call** → TanStack Query hook
3. **HTTP Request** → Express route handler
4. **Validation** → Zod schema validation
5. **Business Logic** → Service layer
6. **Data Access** → Repository pattern
7. **Database** → MongoDB operations
8. **Response** → JSON back to client
9. **UI Update** → React re-render

---

## Project Structure

```
HarvestGuard/
├── client/                    # Frontend React application
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Shadcn/UI base components
│   │   ├── AdvisoryCard.tsx
│   │   ├── CropBatchEntry.tsx
│   │   ├── WeatherCard.tsx
│   │   └── ...
│   ├── context/             # React Context providers
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── LangContext.tsx  # Internationalization
│   ├── hooks/               # Custom React hooks
│   │   ├── useAutoSync.ts   # Offline sync
│   │   ├── useLocalStorage.ts
│   │   └── useOnlineStatus.ts
│   ├── layouts/             # Page layouts
│   │   ├── AppLayout.tsx    # Authenticated pages
│   │   └── PublicLayout.tsx # Public pages
│   ├── locales/             # i18n translations
│   │   └── strings.ts       # English + Bengali
│   ├── pages/               # Route components
│   │   ├── Dashboard.tsx
│   │   ├── Scanner.tsx
│   │   ├── Weather.tsx
│   │   └── ...
│   ├── services/            # API clients & utilities
│   │   ├── api.ts           # HTTP client
│   │   ├── cache.ts         # Client-side caching
│   │   ├── offlineStorage.ts
│   │   └── syncService.ts
│   ├── utils/               # Helper functions
│   ├── App.tsx              # Root component
│   └── global.css           # Global styles
│
├── server/                   # Backend Express application
│   ├── db/                  # Database layer
│   │   ├── connection.ts    # MongoDB connection
│   │   ├── initialize.ts    # Index creation
│   │   ├── repositories/    # Data access layer
│   │   │   ├── farmers.repository.ts
│   │   │   ├── cropBatches.repository.ts
│   │   │   ├── healthScans.repository.ts
│   │   │   └── ...
│   │   └── schemas/         # TypeScript interfaces
│   │       ├── farmer.schema.ts
│   │       ├── cropBatch.schema.ts
│   │       └── ...
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/              # API route handlers
│   │   ├── farmers.ts
│   │   ├── cropBatches.ts
│   │   ├── scanner.ts
│   │   ├── weather.ts
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── gemini.service.ts
│   │   ├── weather.service.ts
│   │   ├── farmer.service.ts
│   │   └── ...
│   ├── utils/               # Helper utilities
│   │   ├── errors.ts
│   │   ├── imageProcessing.ts
│   │   ├── location.ts
│   │   └── password.ts
│   ├── data/                # Static data
│   │   └── bangladesh-locations.ts
│   └── index.ts             # Server entry point
│
├── shared/                   # Shared TypeScript types
│   ├── api.ts               # API request/response types
│   └── README.md
│
├── public/                   # Static assets
│   ├── sw.js                # Service worker
│   ├── manifest.json        # PWA manifest
│   └── icons/
│
├── .env.example             # Environment template
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config (dev)
├── vite.config.server.ts    # Vite config (production)
├── tailwind.config.ts       # Tailwind config
├── components.json          # Shadcn/UI config
└── README.md                # Project overview
```


---

## Installation & Setup

### Prerequisites

- **Node.js**: v18 or higher
- **PNPM**: v8+ (recommended) or npm
- **MongoDB**: Atlas cluster or local instance
- **API Keys**:
  - OpenWeatherMap API key (free tier: 1,000 calls/day)
  - Google Gemini API key

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/harvestguard.git
cd harvestguard
```

### Step 2: Install Dependencies

```bash
# Using PNPM (recommended)
pnpm install

# Or using npm
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=HarvestGuard

# OpenWeatherMap API
OPENWEATHER_API_KEY=your_api_key_here
WEATHER_CACHE_TTL=3600
WEATHER_CACHE_EXTENDED_TTL=7200
WEATHER_API_DAILY_LIMIT=1000
WEATHER_API_WARNING_THRESHOLD=800

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration (optional)
PORT=8080
NODE_ENV=development
PING_MESSAGE="pong"
```

### Step 4: Get API Keys

#### OpenWeatherMap API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key
5. Free tier includes 1,000 calls/day

#### Google Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Create a new API key
4. Copy the key
5. Free tier available

### Step 5: Run Development Server

```bash
pnpm dev
```

This starts:
- **Frontend**: http://localhost:8080 (Vite dev server)
- **Backend**: http://localhost:8080/api (Express middleware)
- **Hot Reload**: Enabled for both frontend and backend

---

## Configuration

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGODB_DB_NAME` | Database name | `HarvestGuard` |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | `abc123...` |
| `GEMINI_API_KEY` | Google Gemini API key | `xyz789...` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | CORS allowed origins | `*` |
| `WEATHER_CACHE_TTL` | Cache duration (seconds) | `3600` |
| `WEATHER_CACHE_EXTENDED_TTL` | Extended cache (seconds) | `7200` |
| `WEATHER_API_DAILY_LIMIT` | Daily API call limit | `1000` |
| `WEATHER_API_WARNING_THRESHOLD` | Warning threshold | `800` |

### TypeScript Configuration

The project uses a shared `tsconfig.json` with path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./client/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

Usage in code:
```typescript
import { Button } from "@/components/ui/button";
import { WeatherData } from "@shared/api";
```

### Vite Configuration

Three Vite configurations for different purposes:

1. **vite.config.ts**: Development server with Express middleware
2. **vite.config.server.ts**: Production full-stack build
3. **vite.config.server-api.ts**: API-only build for separate deployment


---

## Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start dev server (frontend + backend)

# Building
pnpm build                  # Build both client and server
pnpm build:client           # Build frontend only
pnpm build:server           # Build full-stack server
pnpm build:api              # Build API server only
pnpm build:fullstack        # Build client + full-stack server
pnpm build:separate         # Build client + API server

# Production
pnpm start                  # Start production server
pnpm start:fullstack        # Start full-stack server
pnpm start:api              # Start API-only server

# Testing
pnpm test                   # Run all tests
pnpm typecheck              # TypeScript type checking

# Code Quality
pnpm format.fix             # Format code with Prettier

# Preview
pnpm preview:client         # Preview production build
```

### Development Workflow

1. **Start Development Server**
   ```bash
   pnpm dev
   ```

2. **Make Changes**
   - Frontend changes auto-reload via Vite HMR
   - Backend changes require manual restart (or use nodemon)

3. **Test Changes**
   ```bash
   pnpm test
   ```

4. **Type Check**
   ```bash
   pnpm typecheck
   ```

5. **Format Code**
   ```bash
   pnpm format.fix
   ```

### Hot Module Replacement (HMR)

Vite provides instant HMR for:
- React components
- CSS/TailwindCSS
- TypeScript files

Backend changes require server restart.

### Debugging

#### Frontend Debugging
- Use React DevTools browser extension
- Console logs in browser DevTools
- TanStack Query DevTools (included)

#### Backend Debugging
- Console logs in terminal
- VS Code debugger configuration:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["dev"],
  "skipFiles": ["<node_internals>/**"]
}
```

#### Database Debugging
- MongoDB Compass for visual inspection
- MongoDB Atlas UI for cloud monitoring
- Console logs in repository methods


---

## API Documentation

### Base URL

- **Development**: `http://localhost:8080/api`
- **Production**: `https://your-domain.com/api`

### Authentication

Currently uses phone + password authentication. Sessions are managed via MongoDB.

### API Endpoints

#### Health Check

```http
GET /api/health
```

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

---

#### Farmers

##### Register Farmer
```http
POST /api/farmers/register
Content-Type: application/json

{
  "phone": "01712345678",
  "password": "securepass",
  "name": "John Doe",
  "division": "Dhaka",
  "district": "Dhaka",
  "upazila": "Savar",
  "language": "bn"
}
```

##### Login Farmer
```http
POST /api/farmers/login
Content-Type: application/json

{
  "phone": "01712345678",
  "password": "securepass"
}
```

##### Get Farmer Profile
```http
GET /api/farmers/:id
```

##### Update Farmer
```http
PUT /api/farmers/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "language": "en"
}
```

---

#### Crop Batches

##### Create Crop Batch
```http
POST /api/crop-batches
Content-Type: application/json

{
  "farmerId": "507f1f77bcf86cd799439011",
  "cropType": "rice",
  "stage": "growing",
  "estimatedWeightKg": 500,
  "expectedHarvestDate": "2024-06-15T00:00:00.000Z"
}
```

##### Get All Crop Batches
```http
GET /api/crop-batches?farmerId=507f1f77bcf86cd799439011&stage=growing
```

Query Parameters:
- `farmerId`: Filter by farmer
- `stage`: Filter by stage (growing/harvested)
- `cropType`: Filter by crop type
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

##### Get Single Crop Batch
```http
GET /api/crop-batches/:id
```

##### Update Crop Batch
```http
PUT /api/crop-batches/:id
Content-Type: application/json

{
  "finalWeightKg": 480,
  "actualHarvestDate": "2024-06-14T00:00:00.000Z",
  "storageLocation": "silo"
}
```

##### Transition to Harvested
```http
POST /api/crop-batches/:id/transition
Content-Type: application/json

{
  "finalWeightKg": 480,
  "actualHarvestDate": "2024-06-14T00:00:00.000Z",
  "storageLocation": "silo",
  "storageDivision": "Dhaka",
  "storageDistrict": "Dhaka"
}
```

##### Delete Crop Batch
```http
DELETE /api/crop-batches/:id
```

---

#### Health Scans (Disease Detection)

##### Create Health Scan
```http
POST /api/health-scans
Content-Type: application/json

{
  "farmerId": "507f1f77bcf86cd799439011",
  "batchId": "507f1f77bcf86cd799439012",
  "diseaseLabel": "Leaf Blast",
  "confidence": 85,
  "remedyText": "Apply fungicide",
  "imageUrl": "https://...",
  "immediateFeedback": "correct"
}
```

##### Get Health Scans
```http
GET /api/health-scans?farmerId=507f1f77bcf86cd799439011
```

##### Update Scan Status
```http
PATCH /api/health-scans/:id/status
Content-Type: application/json

{
  "status": "resolved"
}
```

##### Update Scan Outcome
```http
PATCH /api/health-scans/:id/outcome
Content-Type: application/json

{
  "outcome": "recovered",
  "immediateFeedback": "correct"
}
```

---

#### Scanner (AI Analysis)

##### Analyze Crop Image
```http
POST /api/scanner/analyze
Content-Type: multipart/form-data

farmerId: 507f1f77bcf86cd799439011
batchId: 507f1f77bcf86cd799439012
image: [binary file]
```

**Response:**
```json
{
  "scan": {
    "_id": "...",
    "diseaseLabel": "Leaf Blast",
    "confidence": 85,
    "remedyText": "Apply Tricyclazole fungicide"
  },
  "analysis": {
    "diseases": [{
      "name": "Leaf Blast",
      "confidence": 85,
      "severity": "high",
      "affectedArea": "leaves"
    }],
    "overallHealth": "major_issues",
    "recommendations": ["Apply fungicide immediately"],
    "preventiveMeasures": []
  }
}
```

---

#### Weather

##### Get Current Weather
```http
GET /api/weather/current?lat=23.8103&lon=90.4125
```

**Response:**
```json
{
  "success": true,
  "data": {
    "location": { "lat": 23.81, "lon": 90.41 },
    "temperature": 32.5,
    "feelsLike": 35.2,
    "humidity": 75,
    "rainfall": 0,
    "weatherCondition": "Clear",
    "weatherDescription": "clear sky",
    "windSpeed": 3.5,
    "source": "openweathermap",
    "cacheStatus": "miss"
  },
  "advisories": []
}
```

##### Get Weather Forecast
```http
GET /api/weather/forecast?lat=23.8103&lon=90.4125
```

##### Get Weather for Farmer
```http
GET /api/weather/farmer/:farmerId
```

##### Get API Usage Stats
```http
GET /api/weather/usage
```

---

#### Dashboard

##### Get Farmer Dashboard
```http
GET /api/dashboard/farmer/:farmerId
```

**Response:**
```json
{
  "farmerId": "...",
  "totalCrops": 10,
  "totalWeightKg": 5000,
  "growingCrops": 3,
  "harvestedCrops": 7,
  "totalLossWeightKg": 150,
  "totalLossPercentage": 3,
  "interventionSuccessRate": 85,
  "badges": ["rain_warrior", "crop_protector"]
}
```

##### Get Admin Dashboard
```http
GET /api/dashboard/admin
```

---

#### Advisories

##### Create Advisory
```http
POST /api/advisories
Content-Type: application/json

{
  "farmerId": "507f1f77bcf86cd799439011",
  "source": "weather",
  "message": "Heavy rain expected",
  "actions": ["Secure crops", "Check drainage"]
}
```

##### Get Advisories
```http
GET /api/advisories?farmerId=507f1f77bcf86cd799439011&status=delivered
```

##### Mark as Read
```http
PATCH /api/advisories/:id/read
```

---

### Error Responses

All errors follow this format:

```json
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid input data",
    "details": {
      "field": "phone",
      "issue": "Invalid phone number format"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

Error Types:
- `ValidationError`: Invalid input data
- `NotFoundError`: Resource not found
- `ConflictError`: Duplicate resource
- `DatabaseError`: Database operation failed
- `AuthenticationError`: Invalid credentials
- `AuthorizationError`: Insufficient permissions
- `GeminiAPIError`: AI service error
- `WeatherAPIError`: Weather service error


---

## Database Schema

### Collections

#### 1. Farmers

```typescript
{
  _id: ObjectId,
  phone: string,              // Unique, indexed
  passwordHash: string,
  name: string,
  division: string,
  district: string,
  upazila: string,
  language: 'bn' | 'en',
  roles: ['farmer' | 'admin'],
  registeredAt: Date,
  location: {                 // GeoJSON for geospatial queries
    type: 'Point',
    coordinates: [lon, lat]
  }
}
```

**Indexes:**
- `phone` (unique)
- `location` (2dsphere for geospatial queries)
- `division, district, upazila` (compound)

---

#### 2. Crop Batches

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,         // Reference to Farmers
  cropType: string,
  stage: 'growing' | 'harvested',
  
  // Growing stage
  estimatedWeightKg?: number,
  expectedHarvestDate?: Date,
  
  // Harvested stage
  finalWeightKg?: number,
  actualHarvestDate?: Date,
  storageLocation?: 'silo' | 'jute_bag' | 'open_space' | 'tin_shed',
  storageDivision?: string,
  storageDistrict?: string,
  
  enteredDate: Date,
  lossPercentage?: number,
  notes?: string,
  batchNumber?: string
}
```

**Indexes:**
- `farmerId`
- `stage`
- `farmerId, stage` (compound)
- `expectedHarvestDate`
- `actualHarvestDate`

---

#### 3. Health Scans

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,
  batchId?: ObjectId,
  capturedAt: Date,
  diseaseLabel: string,
  confidence: number,         // 0-100
  remedyText?: string,
  imageUrl?: string,
  immediateFeedback?: 'correct' | 'incorrect' | 'unsure',
  outcome?: 'recovered' | 'same' | 'worse',
  status: 'pending' | 'resolved' | 'healthy'
}
```

**Indexes:**
- `farmerId`
- `batchId`
- `status`
- `capturedAt`

---

#### 4. Loss Events

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,
  batchId: ObjectId,
  eventType: string,          // e.g., 'pest', 'weather', 'storage'
  lossPercentage: number,
  lossWeightKg: number,
  reportedAt: Date,
  location: string
}
```

**Indexes:**
- `farmerId`
- `batchId`
- `eventType`
- `reportedAt`

---

#### 5. Interventions

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,
  batchId: ObjectId,
  interventionType: string,   // e.g., 'fungicide', 'pesticide'
  success: boolean,
  notes?: string,
  performedAt: Date
}
```

**Indexes:**
- `farmerId`
- `batchId`
- `success`
- `performedAt`

---

#### 6. Advisories

```typescript
{
  _id: ObjectId,
  farmerId?: ObjectId,        // Undefined for broadcast
  source: 'weather' | 'scanner' | 'manual',
  payload: {
    message: string,
    actions?: string[]
  },
  status: 'delivered' | 'read',
  createdAt: Date
}
```

**Indexes:**
- `farmerId`
- `status`
- `createdAt`

---

#### 7. Sessions

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,
  authType: 'otp' | 'password',
  expiresAt: Date,            // TTL index
  deviceMeta?: {
    userAgent?: string,
    ip?: string
  },
  createdAt: Date
}
```

**Indexes:**
- `farmerId`
- `expiresAt` (TTL index for auto-deletion)

---

#### 8. Weather Snapshots

```typescript
{
  _id: ObjectId,
  location: {
    type: 'Point',
    coordinates: [lon, lat]   // GeoJSON
  },
  temperature: number,
  feelsLike: number,
  humidity: number,
  pressure: number,
  windSpeed: number,
  windDirection: number,
  rainfall: number,
  weatherCondition: string,
  weatherDescription: string,
  weatherIcon: string,
  visibility: number,
  cloudiness: number,
  sunrise: Date,
  sunset: Date,
  fetchedAt: Date,
  expiresAt: Date,            // TTL index
  source: string,
  apiCallCount: number
}
```

**Indexes:**
- `location` (2dsphere for geospatial queries)
- `expiresAt` (TTL index for auto-deletion)
- `fetchedAt`

---

### Database Initialization

Indexes are automatically created on server startup via `server/db/initialize.ts`:

```typescript
await initializeIndexes();
```

This ensures optimal query performance for:
- Geospatial queries (farmer locations, weather data)
- Time-based queries (harvest dates, scan dates)
- Compound queries (farmer + stage, farmer + status)
- TTL expiration (sessions, weather cache)


---

## Frontend Architecture

### Component Structure

#### UI Components (Shadcn/UI)
Located in `client/components/ui/`, these are base components:
- `button`, `card`, `dialog`, `dropdown-menu`
- `form`, `input`, `label`, `select`
- `toast`, `tooltip`, `tabs`, `accordion`
- All styled with TailwindCSS and customizable

#### Feature Components
Located in `client/components/`:
- **AdvisoryCard**: Display weather/disease advisories
- **CropBatchEntry**: Crop list item with actions
- **WeatherCard**: Current weather display
- **WeatherAdvisory**: Weather-based recommendations
- **StatsCard**: Dashboard statistics
- **PWAInstallPrompt**: Install app prompt

### State Management

#### React Context
- **AuthContext**: User authentication state
- **LangContext**: Language selection (en/bn)

#### TanStack Query
Used for server state management:

```typescript
// Example: Fetch crop batches
const { data, isLoading, error } = useQuery({
  queryKey: ['cropBatches', farmerId],
  queryFn: () => api.getCropBatches(farmerId)
});
```

Benefits:
- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication

#### Local Storage
Custom hooks for persistent state:
- `useLocalStorage`: Generic local storage hook
- `useAutoSync`: Sync offline data when online
- `useOnlineStatus`: Network status detection

### Routing

React Router v6 with nested routes:

```typescript
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
  <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
  
  {/* Protected Routes */}
  <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
  <Route path="/scanner" element={<AppLayout><Scanner /></AppLayout>} />
  
  {/* 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Styling

#### TailwindCSS
Utility-first CSS framework with custom configuration:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        // ... custom colors
      }
    }
  }
}
```

#### CSS Variables
Theme colors defined in `client/global.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 142 76% 36%;
  /* ... */
}
```

#### Dark Mode
Supported via `next-themes`:

```typescript
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="system">
  <App />
</ThemeProvider>
```

### Forms & Validation

React Hook Form + Zod for type-safe forms:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  cropType: z.string().min(1),
  weight: z.number().positive()
});

const form = useForm({
  resolver: zodResolver(schema)
});
```

### API Client

Centralized API client in `client/services/api.ts`:

```typescript
export const api = {
  // Farmers
  registerFarmer: (data: RegisterFarmerRequest) => 
    post<FarmerResponse>('/api/farmers/register', data),
  
  // Crop Batches
  getCropBatches: (farmerId: string) =>
    get<CropBatchListResponse>(`/api/crop-batches?farmerId=${farmerId}`),
  
  // Weather
  getCurrentWeather: (lat: number, lon: number) =>
    get<WeatherResponse>(`/api/weather/current?lat=${lat}&lon=${lon}`)
};
```


---

## Backend Architecture

### Layered Architecture

```
Routes → Middleware → Services → Repositories → Database
```

#### 1. Routes Layer
HTTP endpoint handlers in `server/routes/`:

```typescript
// Example: cropBatches.ts
export function createCropBatchesRouter() {
  const router = Router();
  
  router.post('/', validateRequest(createSchema), async (req, res, next) => {
    try {
      const batch = await CropBatchService.create(req.body);
      res.status(201).json(batch);
    } catch (error) {
      next(error);
    }
  });
  
  return router;
}
```

#### 2. Middleware Layer
Request processing in `server/middleware/`:

- **validation.ts**: Zod schema validation
- **errorHandler.ts**: Global error handling

```typescript
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(new ValidationError('Invalid request data', error));
    }
  };
}
```

#### 3. Services Layer
Business logic in `server/services/`:

```typescript
// Example: cropBatch.service.ts
export class CropBatchService {
  static async create(data: CreateCropBatchRequest) {
    const repository = new CropBatchesRepository(getDatabase());
    
    // Business logic
    const batch = {
      ...data,
      enteredDate: new Date(),
      batchNumber: generateBatchNumber()
    };
    
    return await repository.create(batch);
  }
}
```

#### 4. Repository Layer
Data access in `server/db/repositories/`:

```typescript
// Example: cropBatches.repository.ts
export class CropBatchesRepository {
  constructor(private db: Db) {}
  
  async create(batch: Omit<CropBatch, '_id'>) {
    const result = await this.db
      .collection('cropBatches')
      .insertOne(batch);
    
    return { _id: result.insertedId, ...batch };
  }
  
  async findByFarmer(farmerId: ObjectId) {
    return await this.db
      .collection('cropBatches')
      .find({ farmerId })
      .toArray();
  }
}
```

### Error Handling

Custom error classes in `server/utils/errors.ts`:

```typescript
export class NotFoundError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

Global error handler:

```typescript
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errorResponse = {
    error: {
      type: err.name,
      message: err.message,
      details: err.details,
      timestamp: new Date().toISOString()
    }
  };
  
  const statusCode = getStatusCode(err.name);
  res.status(statusCode).json(errorResponse);
}
```

### Database Connection

Connection pooling with retry logic:

```typescript
export async function connectToDatabase(
  maxRetries: number = 3,
  retryDelayMs: number = 2000
): Promise<Db> {
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  });
  
  await client.connect();
  return client.db(MONGODB_DB_NAME);
}
```

### Image Processing

Sharp for image optimization:

```typescript
import sharp from 'sharp';

export async function processImage(buffer: Buffer) {
  return await sharp(buffer)
    .resize(1024, 1024, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer();
}
```

### File Upload

Multer for multipart/form-data:

```typescript
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

router.post('/analyze', upload.single('image'), handler);
```


---

## AI & External Services

### Google Gemini AI

#### Service Implementation

Located in `server/services/gemini.service.ts`:

```typescript
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash' 
    });
  }

  async analyzeImage(request: GeminiAnalysisRequest) {
    const prompt = this.buildPrompt(request.language);
    const imagePart = {
      inlineData: {
        data: request.imageBase64,
        mimeType: request.mimeType
      }
    };
    
    const result = await this.model.generateContent([prompt, imagePart]);
    return this.parseResponse(result.response.text());
  }
}
```

#### Prompt Engineering

Bilingual prompts for accurate disease detection:

**English:**
```
Analyze this paddy crop image for diseases. Respond ONLY with JSON:
{
  "disease": "specific disease name or 'Healthy'",
  "confidence": 85,
  "remedy": "brief treatment advice"
}
```

**Bengali:**
```
ধান ফসলের ছবি বিশ্লেষণ করুন। শুধুমাত্র JSON ফরম্যাটে উত্তর দিন:
{
  "disease": "রোগের নাম অথবা 'সুস্থ ধান'",
  "confidence": 85,
  "remedy": "সংক্ষিপ্ত চিকিৎসা পরামর্শ"
}
```

#### Retry Logic

Exponential backoff for API failures:

```typescript
private async retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

#### Error Handling

Custom error class for Gemini failures:

```typescript
export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean = false,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}
```

---

### OpenWeatherMap API

#### Service Implementation

Located in `server/services/weather.service.ts`:

#### Intelligent Caching Strategy

1. **Cache-First Approach**
   - Check MongoDB cache before API call
   - Coordinate rounding for cache key (0.01° precision)
   - TTL-based expiration

2. **Request Deduplication**
   - Track pending requests in memory
   - Prevent duplicate API calls for same location

3. **Fallback to Stale Data**
   - Return expired cache on API failure
   - Graceful degradation

4. **API Usage Tracking**
   ```typescript
   let dailyApiCallCount = 0;
   const API_DAILY_LIMIT = 1000;
   const API_WARNING_THRESHOLD = 800;
   
   function incrementApiCallCounter() {
     dailyApiCallCount++;
     if (dailyApiCallCount >= API_WARNING_THRESHOLD) {
       console.warn('Approaching API limit, extending cache TTL');
     }
   }
   ```

#### Weather Advisory Generation

Automatic farming advisories based on conditions:

```typescript
export function generateAdvisories(weather: WeatherData): Advisory[] {
  const advisories: Advisory[] = [];
  
  // Heat advisory (>35°C)
  if (weather.temperature > 35) {
    advisories.push({
      type: 'heat',
      severity: weather.temperature > 40 ? 'high' : 'medium',
      title: 'High Temperature Alert',
      message: `Temperature is ${weather.temperature}°C`,
      actions: [
        'Increase irrigation frequency',
        'Apply mulch to retain moisture',
        'Monitor for heat stress'
      ]
    });
  }
  
  // Similar logic for rainfall, humidity, wind
  
  return advisories;
}
```

#### Location Mapping

Bangladesh administrative divisions mapped to coordinates:

```typescript
// server/data/bangladesh-locations.ts
export const BANGLADESH_LOCATIONS = {
  'Dhaka': {
    'Dhaka': {
      'Savar': { lat: 23.8583, lon: 90.2667 },
      'Dhamrai': { lat: 23.9167, lon: 90.1333 }
    }
  },
  // ... more divisions/districts/upazilas
};
```


---

## Offline Capabilities

### Progressive Web App (PWA)

#### Manifest Configuration

`public/manifest.json`:

```json
{
  "name": "HarvestGuard",
  "short_name": "HarvestGuard",
  "description": "Agricultural management platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### Service Worker

`public/sw.js` implements network-first strategy:

```javascript
// Cache essential resources on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon.svg'
      ]);
    })
  );
});

// Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});
```

### Offline Storage

#### Local Storage Service

`client/services/offlineStorage.ts`:

```typescript
export const offlineStorage = {
  // Save crop batch offline
  saveCropBatch(batch: CropBatchResponse) {
    const key = `crop_${batch._id}`;
    localStorage.setItem(key, JSON.stringify(batch));
  },
  
  // Get all offline batches
  getOfflineBatches(): CropBatchResponse[] {
    const batches = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('crop_')) {
        const data = localStorage.getItem(key);
        if (data) batches.push(JSON.parse(data));
      }
    }
    return batches;
  },
  
  // Clear synced data
  clearSynced(id: string) {
    localStorage.removeItem(`crop_${id}`);
  }
};
```

### Auto-Sync

#### Sync Hook

`client/hooks/useAutoSync.ts`:

```typescript
export function useAutoSync() {
  const isOnline = useOnlineStatus();
  
  useEffect(() => {
    if (isOnline) {
      syncOfflineData();
    }
  }, [isOnline]);
  
  async function syncOfflineData() {
    const offlineBatches = offlineStorage.getOfflineBatches();
    
    for (const batch of offlineBatches) {
      try {
        await api.createCropBatch(batch);
        offlineStorage.clearSynced(batch._id);
        toast.success('Data synced successfully');
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }
}
```

#### Online Status Detection

`client/hooks/useOnlineStatus.ts`:

```typescript
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}
```

### PWA Installation

#### Install Prompt

`client/components/PWAInstallPrompt.tsx`:

```typescript
export function PWAInstallPrompt() {
  const { canInstall, promptInstall } = usePWAInstall();
  
  if (!canInstall) return null;
  
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white shadow-lg rounded-lg">
      <p>Install HarvestGuard for offline access</p>
      <Button onClick={promptInstall}>Install</Button>
    </div>
  );
}
```

#### Install Hook

`client/hooks/usePWAInstall.ts`:

```typescript
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const promptInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };
  
  return {
    canInstall: !!deferredPrompt,
    promptInstall
  };
}
```


---

## Internationalization

### Language Support

Full bilingual support for English and Bengali (বাংলা).

### Implementation

#### Language Context

`client/context/LangContext.tsx`:

```typescript
type Language = 'en' | 'bn';

interface LangContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof strings.en;
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('bn'); // Default to Bengali
  
  const t = strings[lang];
  
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
```

#### Usage in Components

```typescript
function Dashboard() {
  const { t, lang, setLang } = useLang();
  
  return (
    <div>
      <h1>{t.dashboard.title}</h1>
      <p>{t.dashboard.no_crops_message}</p>
      
      <Button onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}>
        {lang === 'en' ? 'বাংলা' : 'English'}
      </Button>
    </div>
  );
}
```

### Translation Structure

`client/locales/strings.ts`:

```typescript
export const strings = {
  bn: {
    appName: "HarvestGuard",
    dashboard: {
      title: "আপনার খামার",
      no_crops_message: "আপনি এখনো কোন ফসল যোগ করেননি।",
      add_crop_button: "ফসল যোগ করুন"
    },
    crop: {
      title: "ফসল ব্যবস্থাপনা",
      rice: "ধান",
      weight: "পরিমাণ (কেজি)"
    }
  },
  en: {
    appName: "HarvestGuard",
    dashboard: {
      title: "My Farm",
      no_crops_message: "No crops added yet.",
      add_crop_button: "Add Crop"
    },
    crop: {
      title: "Manage Crop",
      rice: "Paddy/Rice",
      weight: "Weight"
    }
  }
};
```

### Location Translations

`client/data/location-translations.ts`:

```typescript
export const locationTranslations = {
  divisions: {
    en: {
      'Dhaka': 'Dhaka',
      'Chittagong': 'Chittagong'
    },
    bn: {
      'Dhaka': 'ঢাকা',
      'Chittagong': 'চট্টগ্রাম'
    }
  },
  districts: {
    // Similar structure
  }
};
```

### Date Formatting

```typescript
function formatDate(date: Date, lang: Language) {
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}
```

### Number Formatting

```typescript
function formatNumber(num: number, lang: Language) {
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
  return new Intl.NumberFormat(locale).format(num);
}
```

---

## Testing

### Test Framework

Vitest for unit and integration tests.

### Configuration

`vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts']
  }
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run with UI
pnpm test --ui

# Run specific file
pnpm test server/services/weather.service.test.ts

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

### Test Examples

#### Unit Test

```typescript
// server/utils/location.test.ts
import { describe, it, expect } from 'vitest';
import { roundCoordinates } from './location';

describe('roundCoordinates', () => {
  it('should round coordinates to 2 decimal places', () => {
    const result = roundCoordinates(23.8103456, 90.4125789);
    expect(result).toEqual({ lat: 23.81, lon: 90.41 });
  });
});
```

#### Integration Test

```typescript
// server/routes/farmers.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../index';

describe('Farmers API', () => {
  let app;
  
  beforeAll(async () => {
    app = await initializeServer();
  });
  
  it('should register a new farmer', async () => {
    const response = await request(app)
      .post('/api/farmers/register')
      .send({
        phone: '01712345678',
        password: 'test123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.name).toBe('Test Farmer');
  });
});
```

### Test Coverage

Current test files:
- `server/db/connection.test.ts`
- `server/routes/*.test.ts` (all route handlers)
- `server/services/*.test.ts` (all services)
- `server/utils/*.test.ts` (utility functions)
- `client/lib/utils.spec.ts`
- `client/services/cache.test.ts`


---

## Deployment

### Deployment Options

#### Option 1: Full-Stack Single Server (Recommended for Small Scale)

Deploy both frontend and backend together on a single server.

**Platforms**: Render, Railway, Heroku

**Build Command**:
```bash
pnpm install && pnpm build:fullstack
```

**Start Command**:
```bash
pnpm start:fullstack
```

**Pros**:
- Simpler deployment
- Single domain
- No CORS issues
- Lower cost

**Cons**:
- Harder to scale independently
- Single point of failure

---

#### Option 2: Separate Frontend/Backend (Recommended for Scale)

Deploy frontend and backend separately.

**Frontend**: Netlify, Vercel, Cloudflare Pages
**Backend**: Render, Railway, AWS Lambda

**Frontend Build**:
```bash
pnpm install && pnpm build:client
```

**Backend Build**:
```bash
pnpm install && pnpm build:api
```

**Backend Start**:
```bash
pnpm start:api
```

**Pros**:
- Independent scaling
- CDN for frontend
- Better performance
- Fault isolation

**Cons**:
- CORS configuration needed
- More complex setup
- Higher cost

---

### Render Deployment

#### Using render.yaml

The project includes `render.yaml` for automatic deployment:

```yaml
services:
  # Backend API
  - type: web
    name: harvestguard-backend
    env: node
    buildCommand: npm install && npm run build:api
    startCommand: node dist/api/api-server.mjs
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: GEMINI_API_KEY
        sync: false
      - key: OPENWEATHER_API_KEY
        sync: false
  
  # Frontend Static Site
  - type: web
    name: harvestguard-frontend
    env: static
    buildCommand: npm install && npm run build:client
    staticPublishPath: dist/spa
```

#### Manual Render Setup

1. **Create New Web Service**
2. **Connect GitHub Repository**
3. **Configure Build Settings**:
   - Build Command: `pnpm install && pnpm build:fullstack`
   - Start Command: `pnpm start:fullstack`
4. **Add Environment Variables**:
   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
   - `GEMINI_API_KEY`
   - `OPENWEATHER_API_KEY`
   - `NODE_ENV=production`
5. **Deploy**

---

### Netlify Deployment (Frontend Only)

1. **Connect Repository**
2. **Build Settings**:
   - Build Command: `pnpm install && pnpm build:client`
   - Publish Directory: `dist/spa`
3. **Environment Variables**:
   - `VITE_API_URL=https://your-backend-url.com`
4. **Add Redirects** (`public/_redirects`):
   ```
   /*    /index.html   200
   ```

---

### Docker Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build:fullstack

# Expose port
EXPOSE 8080

# Start server
CMD ["pnpm", "start:fullstack"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - MONGODB_DB_NAME=${MONGODB_DB_NAME}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
```

**Run**:
```bash
docker-compose up -d
```

---

### Environment-Specific Configuration

#### Production Environment

`.env.production`:
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://prod-user:pass@cluster.mongodb.net/
CORS_ORIGIN=https://yourdomain.com
```

#### Staging Environment

`.env.staging`:
```env
NODE_ENV=staging
PORT=3000
MONGODB_URI=mongodb+srv://staging-user:pass@cluster.mongodb.net/
CORS_ORIGIN=https://staging.yourdomain.com
```

---

### Post-Deployment Checklist

- [ ] Verify MongoDB connection
- [ ] Test API endpoints
- [ ] Check API key validity
- [ ] Verify CORS configuration
- [ ] Test PWA installation
- [ ] Check offline functionality
- [ ] Verify image upload
- [ ] Test AI disease detection
- [ ] Check weather API integration
- [ ] Monitor error logs
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Configure backups
- [ ] Set up SSL/HTTPS
- [ ] Test mobile responsiveness

---

### Monitoring & Logging

#### Application Logs

```typescript
// Structured logging
console.log('[Service] Operation completed', {
  timestamp: new Date().toISOString(),
  userId: farmerId,
  action: 'create_crop'
});
```

#### Error Tracking

Integrate Sentry for error monitoring:

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

#### Performance Monitoring

```typescript
// API response time logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
});
```


---

## Security

### Authentication

#### Password Hashing

Using bcrypt with salt rounds:

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

#### Session Management

Sessions stored in MongoDB with TTL expiration:

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,
  expiresAt: Date,  // TTL index auto-deletes expired sessions
  createdAt: Date
}
```

### Input Validation

#### Zod Schemas

All API inputs validated with Zod:

```typescript
import { z } from 'zod';

const registerSchema = z.object({
  phone: z.string().regex(/^01[0-9]{9}$/),
  password: z.string().min(6),
  name: z.string().min(2),
  division: z.string(),
  district: z.string(),
  upazila: z.string()
});

// Usage in route
router.post('/register', validateRequest(registerSchema), handler);
```

#### Sanitization

```typescript
// Remove dangerous characters
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim();
}
```

### CORS Configuration

```typescript
import cors from 'cors';

const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

### File Upload Security

```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

### Environment Variables

Never commit sensitive data:

```bash
# .gitignore
.env
.env.local
.env.production
.env.staging
```

### SQL Injection Prevention

Using MongoDB driver with parameterized queries:

```typescript
// Safe - parameterized
await db.collection('farmers').findOne({ phone: userInput });

// Unsafe - string concatenation (DON'T DO THIS)
await db.collection('farmers').findOne({ $where: `this.phone == '${userInput}'` });
```

### XSS Prevention

React automatically escapes content, but be careful with:

```typescript
// Safe
<div>{userInput}</div>

// Unsafe - dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### API Key Security

Store API keys in environment variables:

```typescript
// Good
const apiKey = process.env.GEMINI_API_KEY;

// Bad - hardcoded
const apiKey = 'AIzaSyABC123...';
```

### HTTPS/SSL

Always use HTTPS in production:

```typescript
if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
  return res.redirect(`https://${req.hostname}${req.url}`);
}
```

---

## Performance Optimization

### Frontend Optimization

#### Code Splitting

```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Scanner = lazy(() => import('./pages/Scanner'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/scanner" element={<Scanner />} />
  </Routes>
</Suspense>
```

#### Image Optimization

```typescript
// Use Sharp for server-side optimization
await sharp(buffer)
  .resize(1024, 1024, { fit: 'inside' })
  .jpeg({ quality: 85 })
  .toBuffer();
```

#### Bundle Size

Vite automatically:
- Tree-shakes unused code
- Minifies JavaScript
- Optimizes CSS
- Generates source maps

Check bundle size:
```bash
pnpm build:client
# Check dist/spa/assets/
```

#### Caching Strategy

```typescript
// Service Worker caching
const CACHE_NAME = 'harvestguard-v1';

// Cache static assets
cache.addAll([
  '/',
  '/manifest.json',
  '/icon.svg'
]);
```

### Backend Optimization

#### Database Indexing

```typescript
// Create indexes for frequent queries
await db.collection('cropBatches').createIndex({ farmerId: 1, stage: 1 });
await db.collection('farmers').createIndex({ phone: 1 }, { unique: true });
await db.collection('farmers').createIndex({ location: '2dsphere' });
```

#### Connection Pooling

```typescript
const client = new MongoClient(uri, {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000
});
```

#### Query Optimization

```typescript
// Good - projection to limit fields
await db.collection('farmers').find(
  { division: 'Dhaka' },
  { projection: { name: 1, phone: 1 } }
);

// Bad - fetching all fields
await db.collection('farmers').find({ division: 'Dhaka' });
```

#### Caching

Weather data cached in MongoDB with TTL:

```typescript
{
  expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
  // TTL index auto-deletes expired documents
}
```

#### Request Deduplication

```typescript
const pendingRequests = new Map<string, Promise<any>>();

async function fetchData(key: string) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = actualFetch(key);
  pendingRequests.set(key, promise);
  
  try {
    return await promise;
  } finally {
    pendingRequests.delete(key);
  }
}
```

### Monitoring Performance

#### Lighthouse Scores

Target scores:
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90
- PWA: 100

#### Core Web Vitals

- **LCP** (Largest Contentful Paint): <2.5s
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1


---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Error**: `Failed to connect to MongoDB after 3 attempts`

**Solutions**:
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for development)
- Ensure database user has correct permissions
- Check network connectivity

```bash
# Test connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/"
```

---

#### 2. Gemini API Key Not Working

**Error**: `GEMINI_API_KEY is not configured`

**Solutions**:
- Verify API key in `.env`
- Restart development server after adding key
- Check API key validity at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Ensure no extra spaces in `.env` file

```bash
# Check if key is loaded
echo $GEMINI_API_KEY
```

---

#### 3. Weather API Rate Limit

**Error**: `Daily API limit reached`

**Solutions**:
- Wait for daily reset (midnight UTC)
- Increase `WEATHER_CACHE_TTL` to reduce API calls
- Use cached data (automatically falls back)
- Upgrade to paid OpenWeatherMap plan

```typescript
// Check usage
GET /api/weather/usage
```

---

#### 4. Image Upload Fails

**Error**: `File too large` or `Invalid file type`

**Solutions**:
- Ensure image is <5MB
- Use JPEG, PNG, or WebP format
- Check multer configuration
- Verify Sharp is installed correctly

```bash
# Reinstall Sharp
pnpm remove sharp
pnpm add sharp
```

---

#### 5. Build Errors

**Error**: `Module not found` or `Type errors`

**Solutions**:
- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules
  pnpm install
  ```
- Check TypeScript version compatibility
- Verify all dependencies are installed
- Run type check:
  ```bash
  pnpm typecheck
  ```

---

#### 6. PWA Not Installing

**Issue**: Install prompt doesn't appear

**Solutions**:
- Ensure HTTPS (required for PWA)
- Check `manifest.json` is accessible
- Verify service worker registration
- Check browser console for errors
- Test in Chrome DevTools > Application > Manifest

---

#### 7. Offline Sync Not Working

**Issue**: Data not syncing when online

**Solutions**:
- Check browser console for errors
- Verify `useAutoSync` hook is active
- Check localStorage for pending data
- Ensure API endpoints are accessible
- Test network connectivity

```typescript
// Debug sync
console.log('Offline batches:', offlineStorage.getOfflineBatches());
```

---

#### 8. CORS Errors

**Error**: `Access-Control-Allow-Origin`

**Solutions**:
- Set `CORS_ORIGIN` in backend `.env`
- For development, use `CORS_ORIGIN=*`
- For production, set specific domain
- Ensure credentials are configured correctly

```typescript
// Backend CORS config
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
```

---

#### 9. Slow Performance

**Issue**: App feels sluggish

**Solutions**:
- Check network tab for slow API calls
- Verify database indexes are created
- Check weather cache hit rate
- Optimize images (use Sharp)
- Enable React DevTools Profiler
- Check bundle size

```bash
# Analyze bundle
pnpm build:client
ls -lh dist/spa/assets/
```

---

#### 10. Language Not Switching

**Issue**: UI stays in one language

**Solutions**:
- Check `LangContext` is wrapping app
- Verify `useLang()` hook usage
- Check localStorage for saved preference
- Ensure all strings are translated
- Clear browser cache

---

### Debug Mode

Enable verbose logging:

```typescript
// .env
DEBUG=true
LOG_LEVEL=verbose
```

```typescript
// In code
if (process.env.DEBUG) {
  console.log('[Debug]', data);
}
```

---

### Getting Help

1. **Check Logs**: Browser console and server terminal
2. **Search Issues**: GitHub repository issues
3. **Documentation**: Re-read relevant sections
4. **Community**: Ask in discussions
5. **Create Issue**: Provide error logs and steps to reproduce

---

## Contributing

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/harvestguard.git
   ```
3. Create a branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. Make changes and test
5. Commit with clear messages:
   ```bash
   git commit -m "Add amazing feature"
   ```
6. Push to your fork:
   ```bash
   git push origin feature/amazing-feature
   ```
7. Open a Pull Request

### Code Style

- Use Prettier for formatting: `pnpm format.fix`
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation

### Commit Message Format

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Example:
```
feat(scanner): add disease confidence threshold

- Add configurable confidence threshold
- Filter low-confidence results
- Update UI to show confidence level

Closes #123
```

### Pull Request Guidelines

- Describe what the PR does
- Reference related issues
- Include screenshots for UI changes
- Ensure tests pass
- Update documentation if needed

---

## License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2024 HarvestGuard

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments

### Technologies

- **[React](https://react.dev/)** - UI framework
- **[Vite](https://vitejs.dev/)** - Build tool
- **[TailwindCSS](https://tailwindcss.com/)** - Styling
- **[Shadcn/UI](https://ui.shadcn.com/)** - Component library
- **[MongoDB](https://www.mongodb.com/)** - Database
- **[Express](https://expressjs.com/)** - Backend framework
- **[Google Gemini](https://ai.google.dev/)** - AI capabilities
- **[OpenWeatherMap](https://openweathermap.org/)** - Weather data

### Inspiration

This project addresses the critical issue of post-harvest food loss in Bangladesh, where approximately 4.5 million tonnes of grain are lost annually. By providing farmers with accessible technology, we aim to reduce waste and improve food security.

### Contributors

Thank you to all contributors who have helped make HarvestGuard better!

---

## Contact & Support

- **GitHub**: [Repository Issues](https://github.com/yourusername/harvestguard/issues)
- **Email**: support@harvestguard.com
- **Documentation**: This file
- **Website**: https://harvestguard.com

---

**Last Updated**: November 2024

**Version**: 1.0.0

---

*Built with ❤️ for farmers in Bangladesh*
