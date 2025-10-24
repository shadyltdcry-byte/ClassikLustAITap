/**
 * healthRoutes.ts - Health Check and Metrics Endpoints
 * Last Edited: 2025-10-24 by Assistant - Production monitoring endpoints
 */

import { Router } from 'express';
import healthService from '../../shared/services/HealthService';
import circuitService from '../../shared/services/CircuitBreakerService';

const router = Router();
//const healthService = HealthService.getInstance();

/**
 * GET /health - Quick health check for load balancers
 * Fast response, minimal processing
 */
router.get('/', async (req, res) => {
  try {
    const health = await healthService.getBasicHealth();
    
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error?.message || 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/detailed - Comprehensive system status
 * Detailed component checks, may take longer
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = await healthService.getDetailedHealth();
    
    res.status(health.status === 'healthy' ? 200 : 
               health.status === 'degraded' ? 200 : 503)
       .json(health);
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error?.message || 'Detailed health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /metrics - System metrics for monitoring
 * Request counts, response times, circuit breaker status
 */
router.get('/metrics', async (req, res) => {
  try {
    const health = await healthService.getDetailedHealth();
    const circuitStats = circuitService.getAllStats();
    
    res.json({
      timestamp: new Date().toISOString(),
      uptime: health.uptime,
      status: health.status,
      
      // Request metrics
      requests: {
        total: health.metrics.totalRequests,
        errors: health.metrics.totalErrors,
        errorRate: health.metrics.totalRequests > 0 
          ? Math.round((health.metrics.totalErrors / health.metrics.totalRequests) * 100)
          : 0,
        averageResponseTime: health.metrics.averageResponseTime
      },
      
      // System metrics
      system: {
        memory: health.metrics.memoryUsage,
        features: health.metrics.features,
        activeConnections: health.metrics.activeConnections
      },
      
      // Circuit breaker status
      circuitBreakers: circuitStats.map(stat => ({
        name: stat.name,
        state: stat.state,
        failures: stat.failures,
        failureRate: stat.failureRate,
        nextRetry: stat.nextRetryTime ? new Date(stat.nextRetryTime).toISOString() : null
      })),
      
      // Component health summary
      components: health.components.map(comp => ({
        name: comp.name,
        status: comp.status,
        responseTime: comp.responseTime,
        lastCheck: comp.lastCheck
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate metrics',
      details: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /metrics/prometheus - Prometheus-compatible metrics
 * For integration with monitoring systems
 */
router.get('/prometheus', async (req, res) => {
  try {
    const health = await healthService.getDetailedHealth();
    const circuitStats = circuitService.getAllStats();
    
    const metrics = [];
    
    // Request metrics
    metrics.push(`# HELP classik_requests_total Total number of requests`);
    metrics.push(`# TYPE classik_requests_total counter`);
    metrics.push(`classik_requests_total ${health.metrics.totalRequests}`);
    
    metrics.push(`# HELP classik_errors_total Total number of errors`);
    metrics.push(`# TYPE classik_errors_total counter`);
    metrics.push(`classik_errors_total ${health.metrics.totalErrors}`);
    
    // Memory metrics
    metrics.push(`# HELP classik_memory_used_bytes Memory usage in bytes`);
    metrics.push(`# TYPE classik_memory_used_bytes gauge`);
    metrics.push(`classik_memory_used_bytes ${health.metrics.memoryUsage.used * 1024 * 1024}`);
    
    // System status
    metrics.push(`# HELP classik_system_health System health status (1=healthy, 0.5=degraded, 0=unhealthy)`);
    metrics.push(`# TYPE classik_system_health gauge`);
    const statusValue = health.status === 'healthy' ? 1 : health.status === 'degraded' ? 0.5 : 0;
    metrics.push(`classik_system_health ${statusValue}`);
    
    // Circuit breaker metrics
    circuitStats.forEach(stat => {
      const name = stat.name.replace(/-/g, '_');
      metrics.push(`# HELP classik_circuit_${name}_state Circuit breaker state (0=closed, 1=half_open, 2=open)`);
      metrics.push(`# TYPE classik_circuit_${name}_state gauge`);
      const stateValue = stat.state === 'CLOSED' ? 0 : stat.state === 'HALF_OPEN' ? 1 : 2;
      metrics.push(`classik_circuit_${name}_state ${stateValue}`);
      
      metrics.push(`# HELP classik_circuit_${name}_failures Circuit breaker failure count`);
      metrics.push(`# TYPE classik_circuit_${name}_failures counter`);
      metrics.push(`classik_circuit_${name}_failures ${stat.failures}`);
    });
    
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics.join('\n') + '\n');
  } catch (error: any) {
    res.status(500).send(`# Error generating Prometheus metrics: ${error?.message || 'Unknown error'}\n`);
  }
});

/**
 * POST /health/reset - Reset health metrics (admin only)
 */
router.post('/reset', async (req, res) => {
  try {
    // Simple admin check - in production you'd want proper auth
    const adminToken = req.headers.authorization;
    if (!adminToken || !adminToken.includes('admin')) {
      return res.status(401).json({ error: 'Admin access required' });
    }
    
    healthService.resetMetrics();
    circuitService.resetAll();
    
    res.json({
      success: true,
      message: 'Health metrics and circuit breakers reset',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics',
      details: error?.message || 'Unknown error'
    });
  }
});

export default router;