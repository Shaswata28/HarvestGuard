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
- [API Overview](#-api-overview)
- [Deployment](#%EF%B8%8F-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## ✨ Key Features

### For Farmers
- **Smart Crop Management**: Track lifecycle stages from sowing to harvesting.
- **Precision Weather**: Hyper-local forecasts (OpenWeatherMap) with caching for low bandwidth.
- **AI-Powered Disease Detection**: Upload images to diagnose issues via Google Gemini.
- **Interactive Dashboard**: Visual analytics for yield, finance, and resource insights.
- **Bilingual Interface**: Built-in English and Bengali (বাংলা) localization.
- **Offline-First PWA**: Fully functional Progressive Web App without constant connectivity.

### Technical Highlights
- **Shared Contracts**: Monorepo with a unified TypeScript type system.
- **Performance**: Vite build optimizations, code splitting, and lazy loading.
- **Security**: Hardened auth, Zod validation, and secure headers.
- **Geospatial Data**: MongoDB geospatial indexing for mapping and clustering.

---

## 🏗️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, TailwindCSS, Vite, Shadcn/UI, Recharts, Framer Motion |
| **Backend** | Node.js, Express, Zod, Sharp |
| **Database** | MongoDB Atlas (Geospatial Indexing) |
| **AI & ML** | Google Gemini API |
| **External APIs** | OpenWeatherMap |
| **Testing** | Vitest, Supertest |
| **DevOps** | Docker, PNPM, Render / Netlify |

---

## 🏛️ Architecture & Project Structure

Monorepo layout optimized for shared contracts and clear separation of concerns.

```
HarvestGuard/
├── client/          # React SPA (Shadcn/UI, hooks, contexts, pages)
├── server/          # Express routes, services, DB repositories
├── shared/          # Cross-cutting TypeScript types & utilities
└── dist/            # Production build artifacts
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

## 📡 API Overview

RESTful endpoints powering the platform:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/weather/current` | Real-time weather at farmer coordinates |
| `POST` | `/api/scanner/analyze` | Upload crop image for AI diagnosis |
| `GET` | `/api/crop-batches` | List active crop batches |
| `POST` | `/api/farmers/register` | Create a farmer account |
| `GET` | `/api/dashboard/stats` | Aggregate analytics for dashboards |

---

## ☁️ Deployment

### Quick Deploy (Render)
1. Connect repo to Render.
2. Build command: `pnpm install && pnpm build:fullstack`
3. Start command: `pnpm start:fullstack`

### Advanced Options
- **Full-stack single deployment** for simplicity.
- **Split deployment** for scale (frontend on CDN/Netlify, backend on dedicated Node host).

👉 Dive deeper with the [deployment playbook](./DEPLOYMENT-INDEX.md) for architecture diagrams and checklists.

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test --ui
```

---

## 🤝 Contributing

1. Fork the repo.
2. Create a branch: `git checkout -b feature/AmazingFeature`
3. Commit: `git commit -m "Add AmazingFeature"`
4. Push: `git push origin feature/AmazingFeature`
5. Open a pull request.

---

## 📄 License

Licensed under MIT. See the [LICENSE](https://www.google.com/search?q=LICENSE) file for full details.

---

## 🙏 Acknowledgments

- **[OpenWeatherMap](https://openweathermap.org/)** for weather data.
- **[Google Gemini](https://ai.google.dev/)** for AI capabilities.
- **[Shadcn/UI](https://ui.shadcn.com/)** for accessible components.

