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
import express from 'express';
import { registerAdminApi } from '../debugger/modules/adminAPI'; // adjust import as needed
import DebuggerCore from '../debugger/DebuggerCore';
import DebuggerAssist from '../debugger/modules/CharactersPlugin';
import AdminUIPlugin from '../debugger/modules/adminUI';

// Initialize database connection only if DATABASE_URL is provided
let db: any = null;
const connectionString = process.env.DATABASE_URL;
if (connectionString) {
  try {
    const sql = postgres(connectionString);
    db = drizzle(sql);
    console.log('Database connection established');
  } catch (error) {
    console.warn('Database connection fail, running in mock mode:', error);
  }
} else {
  console.warn('DATABASE_URL not provided, running in mock mode');
}

export { db };

function main() {
  console.log("[Main] Server loaded and started successfully... ");
  if (db) {
    console.log("[SupabaseDB] Database connected and loaded successfully...");
  } else {
    console.log("Running in mock mode without database");
  }
  
  // Initialize storage
  console.log("[Storage] Initialized SupabaseDB local storage system... ");
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
  const PORT = process.env.PORT || 5000;
  
  // WebSocket server for real-time features - using different port to avoid conflicts
  let wss;
  try {
    wss = new WebSocketServer({ 
      port: 8082,
      host: '0.0.0.0'
    });

    wss.on('error', (error: any) => {
      console.error('WebSocket server error:', error.message);
    });
  } catch (error: any) {
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