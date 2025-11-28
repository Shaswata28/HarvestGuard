import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { config as dotenvConfig } from "dotenv";
import { initializeServer } from "./server";

// Load .env file explicitly
dotenvConfig();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log('[Vite Config] GEMINI_API_KEY loaded:', !!process.env.GEMINI_API_KEY);
  console.log('[Vite Config] GEMINI_API_KEY value:', process.env.GEMINI_API_KEY?.substring(0, 20) + '...');
  
  return {
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./","./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
};
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer: async (server) => {
      // Initialize database connection and Express app
      try {
        const app = await initializeServer();
        
        // Add Express app as middleware BEFORE Vite's internal middlewares
        // This ensures API routes are handled before SPA fallback
        server.middlewares.use((req, res, next) => {
          // Only handle /api routes with Express
          if (req.url?.startsWith('/api')) {
            app(req, res, next);
          } else {
            next();
          }
        });
        
        console.log('✅ Express server initialized and mounted');
      } catch (error) {
        console.error('❌ Failed to initialize Express server:', error);
        process.exit(1);
      }
    },
  };
}
