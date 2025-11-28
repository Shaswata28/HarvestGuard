import { initializeServer } from "./index";

const port = process.env.PORT || 3000;

// Initialize server with database connection (API only, no static file serving)
initializeServer()
  .then((app) => {
    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // 404 handler for non-API routes
    app.use("*", (req, res) => {
      res.status(404).json({ error: "Endpoint not found" });
    });

    app.listen(port, () => {
      console.log(`🚀 API Server running on port ${port}`);
      console.log(`🔧 API: http://localhost:${port}/api`);
      console.log(`💚 Health: http://localhost:${port}/health`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start API server:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
