# HarvestGuard 🌾

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**HarvestGuard** is a full-stack agricultural management platform that gives farmers real-time insights, AI-assisted crop scanning, offline-first access, and bilingual support. The system is battle-tested for production workloads and bridges traditional farming with modern tooling.

---

## 📘 Table of Contents
- [Key Features](#-key-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Architecture & Project Structure](#-architecture--project-structure)
- [Getting Started](#-getting-started)
- [Feature Highlights](#-feature-highlights)
- [API Overview](#-api-overview)
- [Deployment](#%EF%B8%8F-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## ✨ Key Features

### For Farmers
- **Smart Crop Management**: Track lifecycle stages from sowing to harvesting with batch tracking and loss monitoring.
- **Precision Weather**: Hyper-local forecasts (OpenWeatherMap) with intelligent caching for low bandwidth environments.
- **AI-Powered Disease Detection**: Upload crop images to diagnose issues via Google Gemini with confidence scores and treatment recommendations.
- **Local Risk Map**: Interactive map showing anonymized risk indicators for nearby farms in your district, helping you understand regional threat patterns while protecting privacy.
- **Context-Aware Advisories**: Intelligent recommendations that combine weather forecasts with your specific crop data (type, growth stage, harvest date) to provide actionable guidance in simple Bangla.
- **AI voice Assistant**: Quick-access floating button for instant AI-powered farming assistance and crop advice.
- **Interactive Dashboard**: Visual analytics for yield, loss tracking, intervention success rates, and achievement badges.
- **Bilingual Interface**: Complete English and Bengali (বাংলা) localization with simple language for easy comprehension.
- **Offline-First PWA**: Fully functional Progressive Web App with automatic sync when connectivity returns.
- **Responsive Design**: Optimized experience across all devices from mobile phones (320px) to large desktop screens (1920px+).

### Technical Highlights
- **Shared Contracts**: Monorepo with a unified TypeScript type system across client and server.
- **Performance**: Vite build optimizations, code splitting, lazy loading, and intelligent caching strategies.
- **Security**: Hardened authentication, Zod validation, secure headers, and privacy-preserving data handling.
- **Geospatial Data**: MongoDB geospatial indexing for location-based features, risk mapping, and weather clustering.
- **Property-Based Testing**: Comprehensive test coverage using fast-check for correctness properties validation.

---

## 🏗️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, TailwindCSS, Vite, Shadcn/UI, Recharts, Framer Motion, Leaflet.js |
| **Backend** | Node.js, Express, Zod, Sharp, Multer |
| **Database** | MongoDB Atlas (Geospatial Indexing, TTL Indexes) |
| **AI & ML** | Google Gemini 2.5 Flash API |
| **External APIs** | OpenWeatherMap (Current + Forecast) |
| **Testing** | Vitest, Supertest, fast-check (Property-Based Testing) |
| **DevOps** | Docker, PNPM, Render / Netlify |
| **Maps** | Leaflet.js, react-leaflet, OpenStreetMap tiles |

---

## 🏛️ Architecture & Project Structure

Monorepo layout optimized for shared contracts and clear separation of concerns.

```
HarvestGuard/
├── client/                    # React SPA
│   ├── components/           # UI components
│   │   ├── LocalRiskMap.tsx  # Interactive risk map with Leaflet
│   │   ├── AIAssistant.tsx   # AI chat interface
│   │   ├── AdvisoryCard.tsx  # Advisory display component
│   │   └── ui/               # Shadcn/UI base components
│   ├── pages/                # Route components
│   │   ├── LocalRiskMap.tsx  # Risk map page
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   └── Scanner.tsx       # Disease detection
│   ├── services/             # API clients
│   │   └── localRiskMap.service.ts
│   ├── utils/                # Helper functions
│   │   ├── riskCalculator.ts
│   │   ├── advisoryGenerator.ts
│   │   ├── districtCoordinates.ts
│   │   └── mockDataGenerator.ts
│   └── types/                # TypeScript interfaces
├── server/                    # Express backend
│   ├── routes/               # API endpoints
│   ├── services/             # Business logic
│   │   ├── weatherAdvisory.service.ts
│   │   ├── weather.service.ts
│   │   └── gemini.service.ts
│   ├── utils/                # Server utilities
│   │   └── banglaAdvisoryGenerator.ts
│   └── db/                   # Database layer
│       ├── repositories/     # Data access
│       └── schemas/          # MongoDB schemas
├── shared/                    # Cross-cutting types
│   └── api.ts                # Shared API contracts
├── .kiro/specs/              # Feature specifications
│   ├── local-risk-map/
│   ├── advisory-system-integration/
│   ├── ai-assistant-floating-button/
│   └── responsive-ui-enhancement/
└── dist/                      # Production build artifacts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **PNPM** v8+ (recommended)
- **MongoDB** Atlas cluster or local instance
- **API Keys** for OpenWeatherMap + Google Gemini

### Installation & Setup
1. **Clone**
   ```bash
   git clone https://github.com/yourusername/harvest-guard.git
   cd harvest-guard
   ```
2. **Install**
   ```bash
   pnpm install
   ```
3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Update the essentials:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/
   MONGODB_DB_NAME=HarvestGuard
   OPENWEATHER_API_KEY=your_openweathermap_key
   GEMINI_API_KEY=your_google_gemini_key
   NODE_ENV=development
   PORT=8080
   ```
4. **Run Dev Servers**
   ```bash
   pnpm dev
   ```
   Both Express and React apps start with hot reload on `http://localhost:8080`.

---

## 🎯 Feature Highlights

### Local Risk Map
An interactive map that displays your farm location with actual risk data alongside anonymized risk indicators for nearby farms in your district. Built with Leaflet.js and OpenStreetMap, the map helps farmers understand regional threat patterns while maintaining complete privacy.

**Key Capabilities:**
- **Your Location**: Blue marker showing your actual risk level calculated from database weather and crop data
- **Neighbor Awareness**: 10-15 anonymized risk markers (green/yellow/red) for nearby farms using client-side mock data
- **Bangla Advisories**: Tap any marker to see simple Bangla recommendations combining weather forecasts with crop-specific actions
- **Mobile Optimized**: Touch-friendly interface with responsive design for field use
- **Privacy First**: All neighbor data generated client-side and discarded on unmount - no personal information stored or transmitted

### Context-Aware Advisory System
Intelligent recommendations that go beyond generic weather alerts by combining forecast data with your specific crop information to deliver actionable guidance in simple Bangla.

**How It Works:**
- **Crop Integration**: Analyzes your active crop batches (type, planting date, growth stage, expected harvest date)
- **Weather Analysis**: Monitors temperature, rainfall probability, humidity, and wind conditions
- **Smart Prioritization**: Identifies the most urgent threat when multiple risks exist
- **Harvest Urgency**: Prioritizes harvest-related advisories when crops are within 7 days of expected harvest
- **Simple Language**: Messages formatted as `[Weather + Value] → [Action]` for easy comprehension
- **Duplicate Prevention**: Avoids creating redundant advisories within 24-hour windows

**Example Advisory:**
```
আগামী ৩ দিন বৃষ্টি ৮৫% → আজই ধান কাটুন অথবা ঢেকে রাখুন
(Next 3 days rain 85% → Harvest rice today or cover it)
```

### AI Assistant with Floating Button
Quick-access AI assistance through a prominent floating action button (FAB) positioned in the bottom-right corner of your dashboard.

**Features:**
- **One-Tap Access**: Instantly open AI chat without navigating through menus
- **Mobile Friendly**: 48x48px minimum touch target with proper spacing from bottom navigation
- **Consistent Design**: Matches app's primary color scheme with subtle shadow for depth
- **Accessible**: Full keyboard navigation and screen reader support

### Responsive UI Enhancement
Comprehensive responsive design ensuring optimal experience across all device sizes from mobile phones to large desktop screens.

**Breakpoint Strategy:**
- **Mobile (320px-767px)**: Single-column layouts, bottom navigation, compact spacing, 44x44px touch targets
- **Tablet (768px-1023px)**: 2-column grids, optimized horizontal space usage, moderate spacing
- **Desktop (1024px+)**: 3-4 column layouts, sidebar navigation, generous spacing, max content width 1400px

**Optimizations:**
- Responsive typography scaling (14px mobile → 16px desktop)
- Adaptive images with viewport-appropriate sizes
- Mobile-first approach with progressive enhancement
- Orientation support (portrait and landscape)
- Maintains WCAG 2.1 AA accessibility standards across all breakpoints

---

## 📡 API Overview

RESTful endpoints powering the platform:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/weather/current` | Real-time weather at farmer coordinates |
| `GET` | `/api/weather/forecast` | 5-day weather forecast with hourly data |
| `POST` | `/api/scanner/analyze` | Upload crop image for AI diagnosis |
| `GET` | `/api/crop-batches` | List active crop batches with filtering |
| `POST` | `/api/farmers/register` | Create a farmer account |
| `GET` | `/api/dashboard/farmer/:id` | Farmer dashboard with stats and badges |
| `GET` | `/api/advisories` | Fetch advisories for a farmer |
| `POST` | `/api/advisories/generate` | Generate weather-based advisories |
| `GET` | `/api/health-scans` | Retrieve crop health scan history |

👉 For complete API documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md)

---

## ☁️ Deployment

### Quick Deploy (Render)
1. Connect repo to Render.
2. Build command: `pnpm install && pnpm build:fullstack`
3. Start command: `pnpm start:fullstack`
4. Set environment variables (MongoDB URI, API keys)

### Advanced Options
- **Full-stack single deployment** for simplicity and cost-effectiveness
- **Split deployment** for scale (frontend on CDN/Netlify, backend on dedicated Node host)
- **Docker deployment** using provided Dockerfile

### Environment Requirements
Ensure these environment variables are set:
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name
- `OPENWEATHER_API_KEY` - OpenWeatherMap API key
- `GEMINI_API_KEY` - Google Gemini API key
- `NODE_ENV` - Set to `production`

👉 For detailed deployment guides and architecture diagrams, see [DOCUMENTATION.md](./DOCUMENTATION.md)

---

## 🧪 Testing

The project uses a comprehensive testing strategy combining unit tests and property-based tests:

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test --ui

# Run tests in watch mode
pnpm test --watch
```

**Testing Approach:**
- **Unit Tests**: Verify specific examples, edge cases, and integration points
- **Property-Based Tests**: Use fast-check to validate universal properties across random inputs
- **Coverage Areas**: Risk calculation, advisory generation, coordinate utilities, data transformations, API endpoints

**Example Property Tests:**
- Risk level validity across all weather/crop combinations
- Advisory messages always contain Bangla text and actionable recommendations
- All generated neighbor coordinates stay within district boundaries
- Weather-appropriate advisory recommendations for all conditions

---

## 🗺️ Development Roadmap

### ✅ Completed Features
- [x] Core crop management and tracking
- [x] AI-powered disease detection with Google Gemini
- [x] Weather integration with OpenWeatherMap
- [x] Local risk map with privacy-preserving neighbor data
- [x] Context-aware advisory system with Bangla support
- [x] AI assistant with floating button access
- [x] Responsive UI across all device sizes
- [x] Offline-first PWA capabilities
- [x] MongoDB integration with geospatial indexing
- [x] Property-based testing framework

### 🚧 In Progress
- [ ] Enhanced notification system
- [ ] Profile management improvements
- [ ] Advanced scanner features

### 🔮 Planned Features
- [ ] Multi-language support expansion
- [ ] Advanced analytics and reporting
- [ ] Community features and farmer networks
- [ ] Integration with agricultural extension services
- [ ] Predictive modeling for crop yields

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Make your changes and add tests
4. Run tests: `pnpm test`
5. Commit: `git commit -m "Add AmazingFeature"`
6. Push: `git push origin feature/AmazingFeature`
7. Open a pull request

**Development Guidelines:**
- Follow TypeScript best practices
- Add unit tests for new functionality
- Add property-based tests for algorithms and calculations
- Update documentation for new features
- Ensure responsive design for UI changes
- Test on multiple devices and browsers

---

## 📄 License

Licensed under MIT. See the [LICENSE](https://www.google.com/search?q=LICENSE) file for full details.

---

## 🙏 Acknowledgments

- **[OpenWeatherMap](https://openweathermap.org/)** for comprehensive weather data and forecasting
- **[Google Gemini](https://ai.google.dev/)** for AI-powered crop disease detection
- **[Shadcn/UI](https://ui.shadcn.com/)** for accessible, customizable UI components
- **[Leaflet.js](https://leafletjs.com/)** for interactive mapping capabilities
- **[OpenStreetMap](https://www.openstreetmap.org/)** for map tiles and geographic data
- **[fast-check](https://fast-check.dev/)** for property-based testing framework
- **[MongoDB](https://www.mongodb.com/)** for flexible, geospatial database capabilities
- **[Vite](https://vitejs.dev/)** for lightning-fast development and build tooling

---

## 📚 Additional Resources

- **[Complete Documentation](./DOCUMENTATION.md)** - Comprehensive technical documentation
- **[API Reference](./DOCUMENTATION.md#api-documentation)** - Detailed API endpoint documentation
- **[Database Schema](./DOCUMENTATION.md#database-schema)** - MongoDB collection structures
- **[Feature Specs](./.kiro/specs/)** - Detailed feature requirements and designs

