/**
 * Health Check Middleware
 * Provides a simple health check endpoint for deployment monitoring
 */

import { Express } from "express";

export function setupHealthCheck(app: Express): void {
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.ENVIRONMENT || "unknown",
    });
  });

  app.get("/health/ready", (req, res) => {
    // Readiness check - server is ready to accept traffic
    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health/live", (req, res) => {
    // Liveness check - server is alive
    res.status(200).json({
      live: true,
      timestamp: new Date().toISOString(),
    });
  });
}
