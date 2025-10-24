/**
 * LogDeduplicator.ts - Console Spam Prevention Utility
 * Last Edited: 2025-10-24 by Assistant - Enhanced with user lookup spam reduction
 */

export class LogDeduplicator {
  private static instance: LogDeduplicator;
  private recentLines = new Map<string, number>();
  private readonly DEDUP_WINDOW_MS = 30_000; // 30 seconds
  private readonly MAX_ENTRIES = 1000; // Prevent memory leak

  private constructor() {}

  static getInstance(): LogDeduplicator {
    if (!LogDeduplicator.instance) {
      LogDeduplicator.instance = new LogDeduplicator();
    }
    return LogDeduplicator.instance;
  }

  /**
   * 🧹 DEDUPLICATED LOGGING
   * Prevents the same message from spamming console within time window
   */
  log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    if (this.shouldSuppress(message)) return;
    
    console[level](message);
    this.recordMessage(message);
  }

  /**
   * 🔍 CONDITIONAL LOGGING
   * Only logs if message hasn't appeared recently
   */
  logOnce(message: string, level: 'log' | 'warn' | 'error' = 'log'): boolean {
    if (this.shouldSuppress(message)) return false;
    
    console[level](message);
    this.recordMessage(message);
    return true;
  }

  /**
   * ⚠️ FORCE LOG (BYPASS DEDUP)
   * For critical messages that must always show
   */
  forceLog(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    console[level](message);
    this.recordMessage(message);
  }

  /**
   * 🔍 CHECK IF MESSAGE SHOULD BE SUPPRESSED
   */
  private shouldSuppress(message: string): boolean {
    const now = Date.now();
    const lastSeen = this.recentLines.get(message);
    
    if (!lastSeen) return false;
    
    return (now - lastSeen) < this.DEDUP_WINDOW_MS;
  }

  /**
   * 📋 RECORD MESSAGE TIMESTAMP
   */
  private recordMessage(message: string): void {
    const now = Date.now();
    this.recentLines.set(message, now);
    
    // Cleanup old entries to prevent memory leak
    if (this.recentLines.size > this.MAX_ENTRIES) {
      this.cleanup(now);
    }
  }

  /**
   * 🧹 CLEANUP OLD ENTRIES
   */
  private cleanup(now: number): void {
    const cutoff = now - this.DEDUP_WINDOW_MS;
    
    for (const [message, timestamp] of this.recentLines.entries()) {
      if (timestamp < cutoff) {
        this.recentLines.delete(message);
      }
    }
  }

  /**
   * 📊 STATISTICS
   */
  getStats(): { totalTracked: number; windowMs: number; maxEntries: number } {
    return {
      totalTracked: this.recentLines.size,
      windowMs: this.DEDUP_WINDOW_MS,
      maxEntries: this.MAX_ENTRIES
    };
  }

  /**
   * 🧹 MANUAL CLEANUP
   */
  clear(): void {
    this.recentLines.clear();
  }
}

// Export singleton instance
export const Logger = LogDeduplicator.getInstance();

/**
 * 🚫 SPAM PATTERNS TO SUPPRESS
 * Common noisy messages that should be throttled
 */
export const SPAM_PATTERNS = [
  '[UPGRADES] Auto-initializing schema',
  '[UPGRADES] Schema auto-initialized successfully',
  '[UPGRADES] JSON → DB sync completed',
  '[UPGRADES] Syncing',
  'Database connected and loaded successfully',
  'SupabaseStorage initialized with JSON-first FileStorage',
  'Server loaded and started successfully',
  '[STARTUP] Running comprehensive system preflight',
  '[USER] Looking up: telegram_',
  '[USER] Found by telegramId:',
  '[USER] Found by UUID:',
  'cleanId:', // Part of user lookup spam
  'isTelegram: true' // Part of user lookup spam
];

/**
 * 🔍 UTILITY: Check if message matches spam patterns
 */
export function isSpamMessage(message: string): boolean {
  return SPAM_PATTERNS.some(pattern => message.includes(pattern));
}

/**
 * 🧹 UTILITY: Smart log that auto-detects spam
 */
export function smartLog(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
  if (isSpamMessage(message)) {
    Logger.logOnce(message, level);
  } else {
    Logger.forceLog(message, level);
  }
}

/**
 * 👤 USER LOOKUP LOGGING HELPER
 * Reduces user lookup spam while preserving important info
 */
export function logUserLookup(userId: string, found: boolean, method: string = 'generic'): void {
  // Only log once per user per method to reduce spam
  const key = `user-lookup-${userId}-${method}`;
  const message = `🔍 [USER] ${method}: ${userId} -> ${found ? 'Found' : 'Not Found'}`;
  
  // Use a longer dedup window for user lookups (2 minutes)
  const logger = LogDeduplicator.getInstance();
  const now = Date.now();
  const lastSeen = logger['recentLines'].get(key);
  
  if (!lastSeen || (now - lastSeen) > 120_000) { // 2 minutes
    logger['recentLines'].set(key, now);
    console.log(message);
  }
}

/**
 * 🔧 UPGRADE LOGGING HELPER
 * Specialized logging for upgrade operations
 */
export function logUpgrade(action: string, details: string, level: 'log' | 'warn' | 'error' = 'log'): void {
  const message = `🔧 [UPGRADES] ${action}: ${details}`;
  
  // For upgrade operations, use smart logging to reduce noise
  if (action.includes('Getting') || action.includes('Returning')) {
    Logger.logOnce(message, level);
  } else {
    Logger.forceLog(message, level);
  }
}

/**
 * 💰 PURCHASE LOGGING HELPER
 * Clean logging for purchase operations
 */
export function logPurchase(action: string, upgradeId: string, userId: string, details?: string): void {
  const detailStr = details ? ` (${details})` : '';
  const message = `💰 [PURCHASE] ${action}: ${upgradeId} for ${userId}${detailStr}`;
  Logger.forceLog(message); // Always log purchase operations
}

/**
 * 🎆 BANNER UTILITY: One-time banners
 */
class BannerManager {
  private static shownBanners = new Set<string>();
  
  static showOnce(bannerId: string, lines: string[]): void {
    if (BannerManager.shownBanners.has(bannerId)) return;
    
    BannerManager.shownBanners.add(bannerId);
    lines.forEach(line => console.log(line));
  }
  
  static reset(): void {
    BannerManager.shownBanners.clear();
  }
}

export { BannerManager };

/**
 * 📊 API REQUEST LOGGER
 * Smart logging for HTTP requests to reduce noise
 */
export function logApiRequest(method: string, path: string, status: number, duration?: number): void {
  const durationStr = duration ? ` in ${duration}ms` : '';
  
  // Only log slow requests, errors, or important operations
  if ((duration && duration > 500) || status >= 400 || 
      path.includes('/purchase') || path.includes('/admin/')) {
    const emoji = status >= 500 ? '🔴' : status >= 400 ? '🟡' : status >= 300 ? '🟠' : '🟢';
    const message = `${emoji} ${method} ${path} ${status}${durationStr}`;
    console.log(message);
  }
  // Fast successful requests are suppressed to reduce noise
}

/**
 * 🧹 SYSTEM STARTUP LOGGER
 * Manages startup message deduplication
 */
export function logSystemStartup(component: string, message: string, force: boolean = false): void {
  const fullMessage = `⚙️ [SYSTEM] ${component}: ${message}`;
  
  if (force) {
    Logger.forceLog(fullMessage);
  } else {
    Logger.logOnce(fullMessage);
  }
}

/**
 * 🔄 EXPORT CONVENIENCE OBJECT
 */
export default {
  Logger,
  smartLog,
  logUserLookup,
  logUpgrade,
  logPurchase,
  logApiRequest,
  logSystemStartup,
  BannerManager,
  isSpamMessage
};