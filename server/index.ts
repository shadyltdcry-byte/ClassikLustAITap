/**
 * index.ts
 * Last Edited: 2025-08-17 by Steven
 *
 *
 * 
 *
 */


import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { WebSocketServer } from 'ws';
import { SupabaseStorage } from '../shared/SupabaseStorage';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Initialize database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(connectionString);
export const db = drizzle(sql);

function main() {
  console.log("Starting custom plugin-based game server with Supabase...");
  console.log("Database connected successfully");
}

main();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Express error:', err);
    res.status(status).json({ message });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });



  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const PORT = process.env.PORT || 5001;
  
  // WebSocket server for real-time features
  let wss;
  try {
    wss = new WebSocketServer({ 
      port: 8080,
      host: '0.0.0.0'
    });

    wss.on('error', (error) => {
      console.error('WebSocket server error:', error.message);
    });
  } catch (error) {
    console.warn('WebSocket server failed to start:', error.message);
  }

  server.listen(
    {
      port: PORT,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      console.log(`serving on port ${PORT}`);
    },
  );
})();

// Initialize storage for server operations
const storage = new SupabaseStorage();