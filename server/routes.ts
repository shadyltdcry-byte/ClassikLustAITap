/**
 * routes.ts - Modular Game Routes Orchestrator
 */
import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { registerTapRoutes } from './routes/tapRoutes.js';
import { registerChatRoutes } from './routes/chatRoutes.js';
import { registerCharacterRoutes } from './routes/characterRoutes.js';
import { registerUserRoutes } from './routes/userRoutes.js';
import { registerStatsRoutes } from './routes/statsRoutes.js';
import { registerAdminRoutes as registerAdminRoutesCore } from './routes/adminRoutes.js';
import { registerWheelRoutes } from './routes/wheelRoutes.js';
import { registerVipRoutes } from './routes/vipRoutes.js';
import { registerUpgradeRoutes } from './routes/upgradeRoutes.js';
import { registerDebugRoutes } from './routes/debugRoutes.js';
import { registerAdminRoutes as registerAdminAdditions } from './routes/adminRoutes.additions.js';

// Simple request logging middleware
function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  
  next();
}

// Simple error handler middleware
function errorTriageMiddleware(error: any, req: Request, res: Response, next: NextFunction) {
  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  console.error(`🔴 [ERROR] ${req.method} ${req.path}:`, error);
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Install request logging middleware BEFORE all routes
  app.use(requestLoggerMiddleware);

  // Serve static files from client dist
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  console.log(`💻 [STATIC] Serving frontend from: ${distPath}`);

  // Register all API routes
  registerTapRoutes(app);
  registerChatRoutes(app);
  registerCharacterRoutes(app);
  registerUserRoutes(app);
  registerStatsRoutes(app);
  registerAdminRoutesCore(app);
  registerAdminAdditions(app);
  registerWheelRoutes(app);
  registerVipRoutes(app);
  registerUpgradeRoutes(app);
  registerDebugRoutes(app);

  // SPA fallback route - MUST come after all API routes
  app.get('*', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api')) {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Failed to serve index.html:', err);
          res.status(404).send('Frontend not built. Run: npm run build');
        }
      });
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });

  // Install error handler AFTER all routes
  app.use(errorTriageMiddleware);

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`🎮[SERVER] Game started successfully, running on port ${port}`);
    console.log(`🤖[AI] Triage service active - Mistral primary, Perplexity fallback`);
    console.log(`💻[FRONTEND] Static files served from dist directory`);
  });

  return server;
}