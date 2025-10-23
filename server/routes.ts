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
import { registerTaskRoutes } from './routes/taskRoutes.js';
import { registerAchievementRoutes } from './routes/achievementRoutes.js';
import { registerAdminRoutes as registerAdminRoutesCore } from './routes/adminRoutes.js';
import { registerWheelRoutes } from './routes/wheelRoutes.js';
import { registerVipRoutes } from './routes/vipRoutes.js';
import { registerUpgradeRoutes } from './routes/upgradeRoutes.js';
import { registerLevelRoutes } from './routes/levelRoutes.js';
import { registerDebugRoutes } from './routes/debugRoutes.js';
import { registerAdminRoutes as registerAdminAdditions } from './routes/adminRoutes.additions.js';

// Enhanced request logging middleware with cleaner output
function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      const status = res.statusCode;
      const emoji = status >= 500 ? '🔴' : status >= 400 ? '🟡' : status >= 300 ? '🟠' : '🟢';
      
      // Suppress noisy logs for successful common endpoints
      const suppressedPaths = [
        '/api/auth/telegram/status/',
        '/api/user/',
        '/api/stats/',
        '/api/character/selected'
      ];
      
      const shouldSuppress = suppressedPaths.some(path => req.path.includes(path)) && status === 200;
      
      if (!shouldSuppress || duration > 1000) { // Always log slow requests
        console.log(`${emoji} ${req.method} ${req.path} ${status} in ${duration}ms`);
      }
    }
  });
  
  next();
}

// Enhanced error handler with better telegram ID conflict detection
function errorTriageMiddleware(error: any, req: Request, res: Response, next: NextFunction) {
  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Special handling for common error patterns
  if (req.path.includes('telegram') && message.includes('0 rows')) {
    console.warn(`🤖 [TELEGRAM] User not found for auth check: ${req.path}`);
  } else if (message.includes('PGRST116')) {
    console.warn(`📊 [SUPABASE] Single query returned 0 rows: ${req.method} ${req.path}`);
  } else {
    console.error(`🔴 [ERROR] ${req.method} ${req.path}:`, error);
  }
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Install request logging middleware BEFORE all routes
  app.use(requestLoggerMiddleware);

  // Serve static files from client build output (Vite emits into dist/public)
  const distPath = path.join(process.cwd(), 'dist', 'public');
  app.use(express.static(distPath));
  console.log(`💻 [STATIC] Serving frontend from: ${distPath}`);

  // Register all API routes in logical order
  registerTapRoutes(app);
  registerChatRoutes(app);
  registerCharacterRoutes(app);
  registerUserRoutes(app);
  registerStatsRoutes(app);
  registerTaskRoutes(app); // Task system with progress tracking
  registerAchievementRoutes(app); // NEW: Achievement system with rewards
  registerLevelRoutes(app); // Level requirements and user level calculation
  registerAdminRoutesCore(app);
  registerAdminAdditions(app);
  registerWheelRoutes(app);
  registerVipRoutes(app);
  registerUpgradeRoutes(app);
  registerDebugRoutes(app);

  // SPA fallback route - MUST come after all API routes
  app.get('*', (req, res) => {
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
    console.log(`💻[FRONTEND] Static files served from dist/public directory`);
    console.log(`🏆[ACHIEVEMENTS] Achievement system with progress tracking active`);
    console.log(`📋[TASKS] Task system with reward claiming active`);
    console.log(`🌆[LEVELS] Level system endpoints active`);
    console.log(`🔧[DEBUG] Enhanced error monitoring with intelligent log filtering`);
  });

  return server;
}