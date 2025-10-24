/**
 * CircuitBreakerService.ts - Circuit Breaker Pattern Implementation
 * Last Edited: 2025-10-24 by Assistant - Prevents cascading failures with auto-recovery
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;
  recoveryTimeout: number;
  monitorWindow: number;
  maxRetries?: number;
}

export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime?: number;
  nextRetryTime?: number;
  failureRate: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private requests = 0;
  private lastFailureTime = 0;
  private nextRetryTime = 0;
  private recentRequests: { timestamp: number; success: boolean }[] = [];

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * ⚡ EXECUTE OPERATION WITH CIRCUIT PROTECTION
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.cleanupOldRequests();
    
    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextRetryTime) {
        throw new Error(`Circuit breaker '${this.config.name}' is OPEN. Next retry at ${new Date(this.nextRetryTime).toISOString()}`);
      }
      
      // Transition to half-open for testing
      this.state = 'HALF_OPEN';
      console.log(`🔄 [CIRCUIT] ${this.config.name} transitioning to HALF_OPEN`);
    }

    this.requests++;
    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      // Success - record it
      this.onSuccess();
      this.recentRequests.push({ timestamp: startTime, success: true });
      
      return result;
    } catch (error) {
      // Failure - record it
      this.onFailure();
      this.recentRequests.push({ timestamp: startTime, success: false });
      
      throw error;
    }
  }

  /**
   * ✅ HANDLE SUCCESSFUL REQUEST
   */
  private onSuccess(): void {
    this.successes++;
    
    if (this.state === 'HALF_OPEN') {
      // Success in half-open state - close the circuit
      this.state = 'CLOSED';
      this.failures = 0;
      console.log(`✅ [CIRCUIT] ${this.config.name} closed - service recovered`);
    }
  }

  /**
   * ❌ HANDLE FAILED REQUEST
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    // Check if we should open the circuit
    if (this.failures >= this.config.failureThreshold) {
      this.openCircuit();
    }
  }

  /**
   * 🚨 OPEN THE CIRCUIT
   */
  private openCircuit(): void {
    this.state = 'OPEN';
    this.nextRetryTime = Date.now() + this.config.recoveryTimeout;
    
    console.log(`🚨 [CIRCUIT] ${this.config.name} opened - too many failures (${this.failures}/${this.config.failureThreshold})`);
    console.log(`🔄 [CIRCUIT] ${this.config.name} will retry at ${new Date(this.nextRetryTime).toISOString()}`);
  }

  /**
   * 🧹 CLEANUP OLD REQUEST DATA
   */
  private cleanupOldRequests(): void {
    const cutoff = Date.now() - this.config.monitorWindow;
    this.recentRequests = this.recentRequests.filter(req => req.timestamp > cutoff);
  }

  /**
   * 📊 GET CURRENT STATS
   */
  getStats(): CircuitBreakerStats {
    this.cleanupOldRequests();
    
    const recentFailures = this.recentRequests.filter(req => !req.success).length;
    const recentTotal = this.recentRequests.length;
    const failureRate = recentTotal > 0 ? (recentFailures / recentTotal) * 100 : 0;

    return {
      name: this.config.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      requests: this.requests,
      lastFailureTime: this.lastFailureTime || undefined,
      nextRetryTime: this.state === 'OPEN' ? this.nextRetryTime : undefined,
      failureRate: Math.round(failureRate)
    };
  }

  /**
   * 🔄 MANUAL RESET (ADMIN ONLY)
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
    this.nextRetryTime = 0;
    this.recentRequests = [];
    
    console.log(`🔄 [CIRCUIT] ${this.config.name} manually reset`);
  }
}

/**
 * 🔌 CIRCUIT BREAKER SERVICE MANAGER
 */
export class CircuitBreakerService {
  private static instance: CircuitBreakerService;
  private breakers = new Map<string, CircuitBreaker>();

  static getInstance(): CircuitBreakerService {
    if (!CircuitBreakerService.instance) {
      CircuitBreakerService.instance = new CircuitBreakerService();
    }
    return CircuitBreakerService.instance;
  }

  /**
   * 🏠 CREATE OR GET CIRCUIT BREAKER
   */
  getBreaker(config: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(config.name)) {
      this.breakers.set(config.name, new CircuitBreaker(config));
      console.log(`🏠 [CIRCUIT] Created breaker: ${config.name}`);
    }
    
    return this.breakers.get(config.name)!;
  }

  /**
   * 📊 GET ALL BREAKER STATS
   */
  getAllStats(): CircuitBreakerStats[] {
    return Array.from(this.breakers.values()).map(breaker => breaker.getStats());
  }

  /**
   * 🔄 RESET ALL BREAKERS (ADMIN)
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
    console.log(`🔄 [CIRCUIT] All breakers reset`);
  }

  /**
   * 🔄 RESET SPECIFIC BREAKER (ADMIN)
   */
  reset(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
      return true;
    }
    return false;
  }
}

// Export singleton instance
export default CircuitBreakerService.getInstance();

/**
 * 🏠 PRE-CONFIGURED CIRCUIT BREAKERS
 */
export const CIRCUIT_CONFIGS = {
  SUPABASE_WRITE: {
    name: 'supabase-write',
    failureThreshold: 5,
    recoveryTimeout: 30000, // 30 seconds
    monitorWindow: 60000 // 1 minute
  },
  
  UPGRADE_PURCHASE: {
    name: 'upgrade-purchase',
    failureThreshold: 3,
    recoveryTimeout: 10000, // 10 seconds
    monitorWindow: 30000 // 30 seconds
  },
  
  PASSIVE_CLAIM: {
    name: 'passive-claim',
    failureThreshold: 3,
    recoveryTimeout: 15000, // 15 seconds
    monitorWindow: 45000 // 45 seconds
  },
  
  FILE_STORAGE: {
    name: 'file-storage',
    failureThreshold: 10,
    recoveryTimeout: 5000, // 5 seconds
    monitorWindow: 30000 // 30 seconds
  }
};

/**
 * ⚡ HELPER FUNCTION - WRAP SUPABASE OPERATIONS
 */
export async function withCircuitBreaker<T>(
  configName: keyof typeof CIRCUIT_CONFIGS,
  operation: () => Promise<T>
): Promise<T> {
  const config = CIRCUIT_CONFIGS[configName];
  const breaker = CircuitBreakerService.getInstance().getBreaker(config);
  
  return breaker.execute(operation);
}

/**
 * ⚡ HELPER FUNCTION - WRAP ANY OPERATION
 */
export async function withCustomCircuitBreaker<T>(
  config: CircuitBreakerConfig,
  operation: () => Promise<T>
): Promise<T> {
  const breaker = CircuitBreakerService.getInstance().getBreaker(config);
  
  return breaker.execute(operation);
}