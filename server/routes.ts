/**
 * routes.ts - Modular Game Routes Orchestrator
 */
import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { errorTriageMiddleware, requestLoggerMiddleware } from './middleware/errorTriage';
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

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // CRITICAL: Install error capture middleware BEFORE all routes
  app.use(requestLoggerMiddleware);

  // Serve static files from client dist
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));

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
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });

  // CRITICAL: Install error handler AFTER all routes
  app.use(errorTriageMiddleware);

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`🎮[SERVER] Game started successfully, running on port ${port}`);
    console.log(`🤖[AI] Triage service active - Mistral primary, Perplexity fallback`);
  });

  return server;
}