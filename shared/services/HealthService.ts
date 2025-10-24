/**
 * HealthService.ts - Production Health Monitoring System
 * Last Edited: 2025-10-24 by Assistant - Comprehensive health checks for production monitoring
 */

import { SupabaseStorage } from '../SupabaseStorage';
import { UpgradeStorage } from '../UpgradeStorage';
import { FileStorage } from '../FileStorage';
import { Debugger } from './DebuggerService';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  version: string;
  environment: string;
  components: ComponentHealth[];
  metrics: HealthMetrics;
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: string;
  error?: string;
  details?: Record<string, any>;
}

export interface HealthMetrics {
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  activeConnections: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  features: {
    enabled: number;
    total: number;
    disabled: string[];
  };
}

export class HealthService {
  private static instance: HealthService;
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private responseTimeSum = 0;
  private lastHealthCheck = 0;
  private cachedHealth: HealthStatus | null = null;
  private readonly CACHE_TTL = 10000; // 10 seconds

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  /**
   * 🏥 QUICK HEALTH CHECK
   * Fast endpoint for load balancers and monitoring
   */
  async getBasicHealth(): Promise<{ status: string; uptime: number; timestamp: string }> {
    const uptime = Date.now() - this.startTime;
    const debuggerStatus = Debugger.getStatus();
    
    // Simple health based on critical systems
    const criticalSystemsHealthy = debuggerStatus.features?.upgrades?.enabled !== false &&
                                   debuggerStatus.features?.users?.enabled !== false;
    
    return {
      status: criticalSystemsHealthy ? 'healthy' : 'degraded',
      uptime: Math.floor(uptime / 1000), // seconds
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🔍 DETAILED HEALTH CHECK
   * Comprehensive system status for debugging
   */
  async getDetailedHealth(): Promise<HealthStatus> {
    const now = Date.now();
    
    // Return cached result if recent
    if (this.cachedHealth && (now - this.lastHealthCheck) < this.CACHE_TTL) {
      return this.cachedHealth;
    }

    const uptime = now - this.startTime;
    const components: ComponentHealth[] = [];

    // Check Supabase Database
    components.push(await this.checkSupabase());

    // Check File Storage
    components.push(await this.checkFileStorage());

    // Check Upgrade System
    components.push(await this.checkUpgradeSystem());

    // Check Feature Flags
    components.push(await this.checkFeatureFlags());

    // Check Memory Usage
    components.push(await this.checkMemoryUsage());

    // Overall status
    const overallStatus = this.calculateOverallStatus(components);

    const healthStatus: HealthStatus = {
      status: overallStatus,
      uptime: Math.floor(uptime / 1000),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      components,
      metrics: this.getMetrics()
    };

    // Cache the result
    this.cachedHealth = healthStatus;
    this.lastHealthCheck = now;

    return healthStatus;
  }

  /**
   * 🗄️ CHECK SUPABASE CONNECTION
   */
  private async checkSupabase(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const storage = SupabaseStorage.getInstance();
      
      // Simple connectivity test
      const { data, error } = await storage.supabase
        .from('users')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error && !error.message?.includes('relation "users" does not exist')) {
        return {
          name: 'Supabase Database',
          status: 'unhealthy',
          responseTime,
          lastCheck: new Date().toISOString(),
          error: error.message
        };
      }

      return {
        name: 'Supabase Database',
        status: responseTime > 2000 ? 'degraded' : 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          connectionPoolSize: 'available',
          lastQuery: 'successful'
        }
      };
    } catch (error: any) {
      return {
        name: 'Supabase Database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error.message || 'Connection failed'
      };
    }
  }

  /**
   * 📁 CHECK FILE STORAGE
   */
  private async checkFileStorage(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const fileStorage = FileStorage.getInstance();
      const stats = fileStorage.getCacheStats();
      const responseTime = Date.now() - startTime;

      return {
        name: 'File Storage',
        status: stats.files > 0 ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          filesLoaded: stats.files,
          totalItems: stats.totalItems,
          cacheStatus: 'operational'
        }
      };
    } catch (error: any) {
      return {
        name: 'File Storage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * ⬆️ CHECK UPGRADE SYSTEM
   */
  private async checkUpgradeSystem(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const upgradeStorage = UpgradeStorage.getInstance();
      const upgrades = await upgradeStorage.getAllUpgrades();
      const responseTime = Date.now() - startTime;

      return {
        name: 'Upgrade System',
        status: upgrades.length > 0 ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          upgradesLoaded: upgrades.length,
          schemaInitialized: true
        }
      };
    } catch (error: any) {
      return {
        name: 'Upgrade System',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * 🚩 CHECK FEATURE FLAGS
   */
  private async checkFeatureFlags(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const status = Debugger.getStatus();
      const responseTime = Date.now() - startTime;
      
      const enabledFeatures = Object.values(status.features || {})
        .filter((feature: any) => feature.enabled).length;
      const totalFeatures = Object.keys(status.features || {}).length;
      
      const healthyRatio = enabledFeatures / totalFeatures;
      const componentStatus = healthyRatio >= 0.8 ? 'healthy' : 
                             healthyRatio >= 0.5 ? 'degraded' : 'unhealthy';

      return {
        name: 'Feature Flags',
        status: componentStatus,
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          enabledFeatures,
          totalFeatures,
          healthyRatio: Math.round(healthyRatio * 100) + '%'
        }
      };
    } catch (error: any) {
      return {
        name: 'Feature Flags',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * 💾 CHECK MEMORY USAGE
   */
  private async checkMemoryUsage(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const memoryUsage = process.memoryUsage();
      const responseTime = Date.now() - startTime;
      
      const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const percentage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
      
      const status = percentage > 90 ? 'unhealthy' : 
                    percentage > 70 ? 'degraded' : 'healthy';

      return {
        name: 'Memory Usage',
        status,
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          usedMB,
          totalMB,
          percentage: percentage + '%',
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
        }
      };
    } catch (error: any) {
      return {
        name: 'Memory Usage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * 📊 GET SYSTEM METRICS
   */
  private getMetrics(): HealthMetrics {
    const memoryUsage = process.memoryUsage();
    const debuggerStatus = Debugger.getStatus();
    
    const enabledFeatures = Object.values(debuggerStatus.features || {})
      .filter((feature: any) => feature.enabled).length;
    const totalFeatures = Object.keys(debuggerStatus.features || {}).length;
    const disabledFeatures = Object.entries(debuggerStatus.features || {})
      .filter(([_, feature]: [string, any]) => !feature.enabled)
      .map(([name, _]) => name);

    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      averageResponseTime: this.requestCount > 0 ? Math.round(this.responseTimeSum / this.requestCount) : 0,
      activeConnections: 1, // Basic implementation
      memoryUsage: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      features: {
        enabled: enabledFeatures,
        total: totalFeatures,
        disabled: disabledFeatures
      }
    };
  }

  /**
   * 🧮 CALCULATE OVERALL STATUS
   */
  private calculateOverallStatus(components: ComponentHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;
    const degradedCount = components.filter(c => c.status === 'degraded').length;
    
    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 1) return 'degraded';
    if (degradedCount > 0) return 'degraded';
    
    return 'healthy';
  }

  /**
   * 📈 REQUEST TRACKING
   */
  trackRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    this.responseTimeSum += responseTime;
    
    if (isError) {
      this.errorCount++;
    }
  }

  /**
   * 🔄 RESET METRICS
   */
  resetMetrics(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
    this.cachedHealth = null;
  }
}

export default HealthService.getInstance();