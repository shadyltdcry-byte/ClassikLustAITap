/**
 * DebuggerAssist - Helper Utilities
 * 
 * Provides helper utilities for monitoring, error reporting,
 * and other cross-cutting concerns
 */

import { DebuggerCore } from './DebuggerCore';
import { DebuggerPlugin } from './DebuggerPlugin';

export interface HealthCheckResult {
  plugin: string;
  status: string;
  healthy: boolean;
  lastResponse?: number;
  errors?: string[];
}

export interface SystemMetrics {
  uptime: number;
  totalCommands: number;
  failedCommands: number;
  activePlugins: number;
  memoryUsage?: {
    used: number;
    total: number;
  };
}

export class DebuggerAssist {
  private core: DebuggerCore;
  private metrics: SystemMetrics;
  private healthHistory: Map<string, HealthCheckResult[]> = new Map();
  private commandHistory: Array<{
    command: string;
    timestamp: number;
    success: boolean;
    duration?: number;
  }> = [];

  constructor(core: DebuggerCore) {
    this.core = core;
    this.metrics = {
      uptime: Date.now(),
      totalCommands: 0,
      failedCommands: 0,
      activePlugins: 0
    };
  }

  /**
   * Perform health check on all plugins
   */
  async performHealthCheck(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    const plugins = this.core.getPlugins();

    for (const plugin of plugins) {
      const startTime = Date.now();
      let healthy = true;
      let errors: string[] = [];

      try {
        // Try to run a health check command
        await plugin.run('health_check', {});
        const responseTime = Date.now() - startTime;
        
        results.push({
          plugin: plugin.getName(),
          status: plugin.getStatus(),
          healthy: true,
          lastResponse: responseTime
        });
      } catch (error) {
        healthy = false;
        errors.push(String(error));
        
        results.push({
          plugin: plugin.getName(),
          status: plugin.getStatus(),
          healthy: false,
          errors
        });
      }
    }

    // Store health history
    const timestamp = Date.now();
    for (const result of results) {
      if (!this.healthHistory.has(result.plugin)) {
        this.healthHistory.set(result.plugin, []);
      }
      
      const history = this.healthHistory.get(result.plugin)!;
      history.push({ ...result });
      
      // Keep only last 100 health checks per plugin
      if (history.length > 100) {
        history.shift();
      }
    }

    this.core.log(`[DebuggerAssist] Health check completed for ${results.length} plugins`, 'info');
    return results;
  }

  /**
   * Monitor command execution
   */
  monitorCommand(command: string, success: boolean, duration?: number): void {
    this.metrics.totalCommands++;
    if (!success) {
      this.metrics.failedCommands++;
    }

    this.commandHistory.push({
      command,
      timestamp: Date.now(),
      success,
      duration
    });

    // Keep only last 1000 commands
    if (this.commandHistory.length > 1000) {
      this.commandHistory.shift();
    }

    // Log warning if failure rate is high
    const recentCommands = this.commandHistory.slice(-10);
    const failureRate = recentCommands.filter(c => !c.success).length / recentCommands.length;
    
    if (failureRate > 0.5) {
      this.core.log(`[DebuggerAssist] High failure rate detected: ${(failureRate * 100).toFixed(1)}%`, 'warning');
    }
  }

  /**
   * Get system metrics
   */
  getMetrics(): SystemMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime,
      activePlugins: this.core.getPlugins().filter(p => p.getStatus() === 'ready').length,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): { used: number; total: number } | undefined {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        used: usage.heapUsed,
        total: usage.heapTotal
      };
    }
    return undefined;
  }

  /**
   * Generate system report
   */
  generateReport(): {
    timestamp: string;
    metrics: SystemMetrics;
    systemStatus: any;
    recentErrors: string[];
    pluginHealth: HealthCheckResult[];
  } {
    const logs = this.core.getLogHistory();
    const recentErrors = logs
      .filter(log => log.level === 'error')
      .slice(-10)
      .map(log => log.message);

    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      systemStatus: this.core.getStatus(),
      recentErrors,
      pluginHealth: Array.from(this.healthHistory.values()).map(history => history[history.length - 1]).filter(Boolean)
    };
  }

  /**
   * Auto-recover failed plugins
   */
  async autoRecover(): Promise<void> {
    const plugins = this.core.getPlugins();
    const failedPlugins = plugins.filter(p => p.getStatus() === 'error');

    if (failedPlugins.length === 0) {
      return;
    }

    this.core.log(`[DebuggerAssist] Attempting to recover ${failedPlugins.length} failed plugins`, 'warning');

    for (const plugin of failedPlugins) {
      try {
        await plugin.stop();
        await plugin.init(this.core);
        this.core.log(`[DebuggerAssist] Successfully recovered plugin: ${plugin.getName()}`, 'success');
      } catch (error) {
        this.core.log(`[DebuggerAssist] Failed to recover plugin ${plugin.getName()}: ${error}`, 'error');
      }
    }
  }

  /**
   * Validate plugin dependencies
   */
  validateDependencies(plugin: DebuggerPlugin, dependencies: string[]): boolean {
    const availablePlugins = this.core.getPlugins().map(p => p.getName());
    const missingDeps = dependencies.filter(dep => !availablePlugins.includes(dep));

    if (missingDeps.length > 0) {
      this.core.log(`[DebuggerAssist] Plugin ${plugin.getName()} missing dependencies: ${missingDeps.join(', ')}`, 'error');
      return false;
    }

    return true;
  }

  /**
   * Schedule periodic health checks
   */
  startPeriodicHealthCheck(intervalMs: number = 30000): NodeJS.Timeout | number {
    return setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }
}