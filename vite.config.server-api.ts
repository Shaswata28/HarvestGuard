import { defineConfig } from "vite";
import path from "path";

// API-only server build configuration (no frontend serving)
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/api-only.ts"),
      name: "api-server",
      fileName: "api-server",
      formats: ["es"],
    },
    outDir: "dist/api",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        // External dependencies that should not be bundled
        "express",
        "cors",
        "mongodb",
        "bcrypt",
        "dotenv",
        "zod",
        "multer",
        "sharp",
        "@google/generative-ai",
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
