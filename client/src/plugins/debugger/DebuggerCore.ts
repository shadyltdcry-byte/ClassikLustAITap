/**
 * DebuggerCore - The Central Orchestrator
 * 
 * Manages all registered plugins in sequence order
 * Provides lifecycle management and centralized logging
 */

import { DebuggerPlugin } from './DebuggerPlugin';

export interface LogLevel {
  SUCCESS: 'success';
  INFO: 'info';
  WARNING: 'warning';
  ERROR: 'error';
}

export interface CommandData {
  [key: string]: any;
}

export class DebuggerCore {
  private plugins: DebuggerPlugin[] = [];
  private isInitialized: boolean = false;
  private logHistory: Array<{
    timestamp: string;
    message: string;
    level: string;
    plugin?: string;
  }> = [];

  constructor() {
    this.log('[DebuggerCore] Initializing debugger system...', 'info');
  }

  /**
   * Register a plugin in the execution sequence
   */
  register(plugin: DebuggerPlugin): void {
    if (this.plugins.find(p => p.getName() === plugin.getName())) {
      this.log(`[DebuggerCore] Plugin ${plugin.getName()} already registered`, 'warning');
      return;
    }
    
    this.plugins.push(plugin);
    this.log(`[DebuggerCore] Registered plugin: ${plugin.getName()}`, 'success');
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginName: string): boolean {
    const index = this.plugins.findIndex(p => p.getName() === pluginName);
    if (index !== -1) {
      this.plugins.splice(index, 1);
      this.log(`[DebuggerCore] Unregistered plugin: ${pluginName}`, 'info');
      return true;
    }
    return false;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): DebuggerPlugin[] {
    return [...this.plugins];
  }

  /**
   * Initialize all plugins sequentially
   */
  async initAll(): Promise<void> {
    if (this.isInitialized) {
      this.log('[DebuggerCore] System already initialized', 'warning');
      return;
    }

    this.log('[DebuggerCore] Initializing all plugins...', 'info');
    
    for (const plugin of this.plugins) {
      try {
        await plugin.init(this);
        this.log(`[${plugin.getName()}] Plugin initialized successfully`, 'success');
      } catch (error) {
        this.log(`[${plugin.getName()}] Initialization failed: ${error}`, 'error');
        // Continue with other plugins despite failure
      }
    }
    
    this.isInitialized = true;
    this.log('[DebuggerCore] All plugins initialized', 'success');
  }

  /**
   * Run a command across all plugins
   */
  async runCommand(command: string, data: CommandData = {}): Promise<void> {
    if (!this.isInitialized) {
      this.log('[DebuggerCore] System not initialized. Call initAll() first.', 'error');
      return;
    }

    this.log(`[DebuggerCore] Broadcasting command: ${command}`, 'info');
    
    for (const plugin of this.plugins) {
      try {
        await plugin.run(command, data);
      } catch (error) {
        this.log(`[${plugin.getName()}] Command '${command}' failed: ${error}`, 'error');
        // Continue with other plugins despite failure
      }
    }
  }

  /**
   * Stop all plugins cleanly
   */
  async stopAll(): Promise<void> {
    this.log('[DebuggerCore] Stopping all plugins...', 'info');
    
    // Stop in reverse order for clean shutdown
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      const plugin = this.plugins[i];
      try {
        await plugin.stop();
        this.log(`[${plugin.getName()}] Plugin stopped successfully`, 'success');
      } catch (error) {
        this.log(`[${plugin.getName()}] Stop failed: ${error}`, 'error');
      }
    }
    
    this.isInitialized = false;
    this.log('[DebuggerCore] All plugins stopped', 'info');
  }

  /**
   * Centralized logging with color coding and timestamps
   */
  log(message: string, level: string = 'info', pluginName?: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      level,
      plugin: pluginName
    };
    
    this.logHistory.push(logEntry);
    
    // Color coding for console output
    const colors = {
      success: '\x1b[32m', // Green
      info: '\x1b[37m',     // White
      warning: '\x1b[33m',  // Yellow
      error: '\x1b[31m',    // Red
      reset: '\x1b[0m'
    };
    
    const color = colors[level as keyof typeof colors] || colors.info;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  /**
   * Get log history
   */
  getLogHistory(): Array<{
    timestamp: string;
    message: string;
    level: string;
    plugin?: string;
  }> {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearLogs(): void {
    this.logHistory = [];
    this.log('[DebuggerCore] Log history cleared', 'info');
  }

  /**
   * Get system status
   */
  getStatus(): {
    initialized: boolean;
    pluginCount: number;
    plugins: Array<{
      name: string;
      status: string;
    }>;
  } {
    return {
      initialized: this.isInitialized,
      pluginCount: this.plugins.length,
      plugins: this.plugins.map(plugin => ({
        name: plugin.getName(),
        status: plugin.getStatus()
      }))
    };
  }
}