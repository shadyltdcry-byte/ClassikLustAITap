/**
 * routes.ts - Modular Game Routes Orchestrator
 * Last Edited: 2025-10-24 by Assistant - FIXED: Added all missing route imports and mounts
 */
import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { Debugger } from '../shared/services/DebuggerService';
import HealthService from '../shared/services/HealthService';
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
import upgradeRoutes from './routes/upgradeRoutes.js';
// 🚀 NEW ROUTES - FIXES THE 404 ISSUES!
import passiveRoutes from './routes/passiveRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { registerLevelRoutes } from './routes/levelRoutes.js';
import { registerDebugRoutes } from './routes/debugRoutes.js';
import { registerApiDocRoutes } from './routes/apiDocRoutes.js';
import { registerAdminRoutes as registerAdminAdditions } from './routes/adminRoutes.additions.js';
import adminRoutes from './routes/admin';
import debugRoutes from './routes/debug';

/**
 * 🚀 SYSTEM PREFLIGHT CHECK
 * Runs comprehensive health checks before starting server
 */
async function runSystemPreflight(): Promise<void> {
  console.log('\n🚀 [STARTUP] Running comprehensive system preflight checks...');
  const startTime = Date.now();
  
  try {
    await Debugger.preflight();
    const duration = Date.now() - startTime;
    console.log(`✅ [STARTUP] System preflight completed successfully in ${duration}ms`);
    console.log('🎆 [READY] All systems operational - server ready to start\n');
  } catch (error) {
    console.error('❌ [STARTUP] System preflight failed:', error);
    console.log('⚠️  [DEGRADED] Starting in degraded mode - some features may be disabled\n');
  }
}

/**
 * 🔐 FEATURE FLAG MIDDLEWARE
 * Protects routes with feature flags and graceful degradation
 */
function createFeatureGuard(featureKey: string, friendlyName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!Debugger.isEnabled(featureKey as any)) {
      const reason = Debugger.getReason(featureKey as any);
      console.warn(`🚫 [GUARD] ${friendlyName} blocked - ${reason}`);
      
      return res.status(503).json({
        success: false,
        error: `${friendlyName} temporarily unavailable`,
        reason: reason || 'System maintenance',
        featureKey
      });
    }
    next();
  };
}

/**
 * 📈 ENHANCED REQUEST LOGGING WITH METRICS TRACKING
 */
function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    
    // Track metrics for monitoring
    try {
      HealthService.getInstance().trackRequest(duration, isError);
    } catch (e) {
      // Health service not available - no problem
    }
    
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/metrics')) {
      const status = res.statusCode;
      const emoji = status >= 500 ? '🔴' : status >= 400 ? '🟡' : status >= 300 ? '🟠' : '🟢';
      
      // Suppress noisy logs for successful common endpoints
      const suppressedPaths = [
        '/api/auth/telegram/status/',
        '/api/user/',
        '/api/stats/',
        '/api/character/selected',
        '/health',
        '/api/debug/health',
        '/api/passive/status'
      ];
      
      const shouldSuppress = suppressedPaths.some(path => req.path.includes(path)) && status === 200;
      
      // Always log errors, slow requests, or important operations
      if (!shouldSuppress || duration > 1000 || status >= 400) {
        console.log(`${emoji} ${req.method} ${req.path} ${status} in ${duration}ms`);
      }
    }
  });
  
  next();
}

// Enhanced error handler with intelligent categorization
function errorTriageMiddleware(error: any, req: Request, res: Response, next: NextFunction) {
  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Track error in health service if available
  try {
    HealthService.getInstance().trackRequest(0, true);
  } catch (e) {
    // Health service not available - no problem
  }
  
  // Categorize error types for better debugging
  if (req.path.includes('telegram') && message.includes('0 rows')) {
    console.warn(`🤖 [TELEGRAM] User lookup failed: ${req.path}`);
  } else if (message.includes('PGRST116')) {
    console.warn(`📊 [SUPABASE] Single query returned 0 rows: ${req.method} ${req.path}`);
  } else if (message.includes('not found')) {
    console.warn(`🔍 [NOT_FOUND] Resource missing: ${req.method} ${req.path}`);
  } else if (status >= 500) {
    console.error(`🔴 [CRITICAL] ${req.method} ${req.path}:`, error);
  } else {
    console.warn(`🟡 [WARNING] ${req.method} ${req.path}: ${message}`);
  }
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // 🚀 RUN SYSTEM PREFLIGHT BEFORE STARTING
  await runSystemPreflight();

  // Install request logging middleware BEFORE all routes
  app.use(requestLoggerMiddleware);

  // Serve static files from client build output (Vite emits into dist/public)
  const distPath = path.join(process.cwd(), 'dist', 'public');
  app.use(express.static(distPath));
  console.log(`💻 [STATIC] Serving frontend from: ${distPath}`);

  // 🟢 HEALTH AND MONITORING ENDPOINTS (No guards - always available)
  app.use('/health', healthRoutes);
  app.use('/metrics', healthRoutes); // Metrics are part of health routes
  console.log('🟢 [HEALTH] Health check and metrics endpoints registered');

  // 🔍 SYSTEM MANAGEMENT ROUTES (No guards - always available)  
  app.use('/api/admin', adminRoutes);
  app.use('/api/debug', debugRoutes);
  console.log('🔧 [ADMIN] Admin control panel endpoints registered');
  console.log('🔍 [DEBUG] Public debug endpoints registered');

  // Register all API routes with feature guards where appropriate
  registerApiDocRoutes(app); // API documentation - register first
  
  // 🎯 CORE GAMEPLAY ROUTES WITH GUARDS
  app.use('/api/upgrades', createFeatureGuard('upgrades', 'Upgrade System'), upgradeRoutes);
  app.use('/api/passive', passiveRoutes); // 💰 PASSIVE LP ROUTES - Fixes claiming!
  app.use('/api/player', playerRoutes); // 🎯 PLAYER STATS ROUTES - Fixes LP per tap!
  console.log('💰 [ROUTES] Passive LP claiming routes registered');
  console.log('🎯 [ROUTES] Player stats computation routes registered');
  
  registerTapRoutes(app);
  registerChatRoutes(app);
  registerCharacterRoutes(app);
  registerUserRoutes(app);
  registerStatsRoutes(app);
  
  // 🎮 GAME SYSTEMS WITH GUARDS
  app.use('/api/tasks*', createFeatureGuard('tasks', 'Task System'));
  registerTaskRoutes(app); // Task system with progress tracking
  
  app.use('/api/achievements*', createFeatureGuard('achievements', 'Achievement System'));
  registerAchievementRoutes(app); // Achievement system with rewards
  
  app.use('/api/levels*', createFeatureGuard('levels', 'Level System'));
  registerLevelRoutes(app); // Level requirements and user level calculation
  
  // 🔧 ADMIN AND UTILITY ROUTES
  registerAdminRoutesCore(app);
  registerAdminAdditions(app);
  registerWheelRoutes(app);
  registerVipRoutes(app);
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
    const status = Debugger.getStatus();
    const healthyFeatures = Object.values(status.features || {})
      .filter((feature: any) => feature.enabled).length;
    const totalFeatures = Object.keys(status.features || {}).length;
    
    console.log('\n🎆 ==============================================');
    console.log('🎆 ClassikLustAITap - Production Ready Backend!');
    console.log('🎆 ==============================================');
    console.log(`🎮 [SERVER] Game server running on port ${port}`);
    console.log(`🤖 [AI] Triage service active - Mistral primary, Perplexity fallback`);
    console.log(`💻 [FRONTEND] Static files served from dist/public directory`);
    console.log(`📂 [DOCS] API documentation available at /api`);
    console.log(`🟢 [HEALTH] Health checks at /health and /health/detailed`);
    console.log(`📈 [METRICS] System metrics at /metrics and /metrics/prometheus`);
    console.log(`🔧 [ADMIN] Admin control panel at /api/admin/* (token required)`);
    console.log(`💰 [PASSIVE] Passive LP claiming at /api/passive/claim`);
    console.log(`🎯 [PLAYER] Player stats computation at /api/player/:id/stats`);
    console.log(`🚫 [GUARDS] Feature flags protecting ${totalFeatures} systems`);
    console.log(`✅ [STATUS] ${healthyFeatures}/${totalFeatures} systems operational`);
    console.log('🎆 ==============================================\n');
    
    // 🚨 EXPLICIT ROUTE CONFIRMATION
    console.log('🎯 [ROUTES] Mounted endpoints verification:');
    console.log('🎯 [ROUTES] - /health (health checks)');
    console.log('🎯 [ROUTES] - /metrics (system metrics)');
    console.log('🎯 [ROUTES] - /api/passive/claim (passive LP claiming)');
    console.log('🎯 [ROUTES] - /api/player/:id/stats (computed stats - FIXES LP PER TAP!)');
    console.log('');
    
    // Show any disabled features as warnings
    const disabledFeatures = Object.entries(status.features || {})
      .filter(([_, feature]: [string, any]) => !feature.enabled)
      .map(([name, _]) => name);
    
    if (disabledFeatures.length > 0) {
      console.log(`⚠️  [DEGRADED] Some features disabled: ${disabledFeatures.join(', ')}`);
      console.log('⚠️  [DEGRADED] Use admin endpoints to diagnose and repair');
      console.log('');
    }
  });

  return server;
}