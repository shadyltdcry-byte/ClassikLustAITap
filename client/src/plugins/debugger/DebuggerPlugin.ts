/**
 * DebuggerPlugin - Base Plugin Contract
 * 
 * Abstract base class that all plugins must extend
 * Ensures uniform plugin behavior and lifecycle handling
 */

import { DebuggerCore, CommandData } from './DebuggerCore';

export abstract class DebuggerPlugin {
  protected name: string;
  protected status: 'uninitialized' | 'initializing' | 'ready' | 'running' | 'stopping' | 'stopped' | 'error';
  protected core?: DebuggerCore;

  constructor(name: string) {
    this.name = name;
    this.status = 'uninitialized';
  }

  /**
   * Get plugin name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get plugin status
   */
  getStatus(): string {
    return this.status;
  }

  /**
   * Set plugin status and log it
   */
  protected setStatus(status: typeof this.status, message?: string): void {
    this.status = status;
    if (this.core && message) {
      const logLevel = status === 'error' ? 'error' : 
                     status === 'ready' ? 'success' : 'info';
      this.core.log(`[${this.name}] ${message}`, logLevel);
    }
  }

  /**
   * Initialize the plugin
   * Called once when the debugger system starts
   * 
   * @param core - Reference to the DebuggerCore instance
   */
  async init(core: DebuggerCore): Promise<void> {
    this.core = core;
    this.setStatus('initializing', 'Initializing plugin...');
    
    try {
      await this.onInit(core);
      this.setStatus('ready', 'Plugin initialized successfully');
    } catch (error) {
      this.setStatus('error', `Initialization failed: ${error}`);
      throw error;
    }
  }

  /**
   * Handle runtime commands
   * Plugins should implement this to respond to relevant commands
   * 
   * @param command - The command to process
   * @param data - Command data/parameters
   */
  async run(command: string, data: CommandData): Promise<void> {
    if (this.status !== 'ready' && this.status !== 'running') {
      return; // Plugin not ready, ignore command
    }

    this.setStatus('running');
    
    try {
      await this.onRun(command, data);
      this.setStatus('ready');
    } catch (error) {
      this.setStatus('error', `Command '${command}' failed: ${error}`);
      throw error;
    }
  }

  /**
   * Stop the plugin
   * Called when the debugger system shuts down
   */
  async stop(): Promise<void> {
    if (this.status === 'stopped' || this.status === 'uninitialized') {
      return;
    }

    this.setStatus('stopping', 'Stopping plugin...');
    
    try {
      await this.onStop();
      this.setStatus('stopped', 'Plugin stopped successfully');
    } catch (error) {
      this.setStatus('error', `Stop failed: ${error}`);
      throw error;
    }
  }

  /**
   * Abstract methods that plugins must implement
   */
  
  /**
   * Plugin-specific initialization logic
   */
  protected abstract onInit(core: DebuggerCore): Promise<void>;

  /**
   * Plugin-specific command handling logic
   */
  protected abstract onRun(command: string, data: CommandData): Promise<void>;

  /**
   * Plugin-specific cleanup logic
   */
  protected abstract onStop(): Promise<void>;

  /**
   * Helper method for logging from plugins
   */
  protected log(message: string, level: string = 'info'): void {
    if (this.core) {
      this.core.log(`[${this.name}] ${message}`, level);
    }
  }

  /**
   * Helper method to check if plugin is ready
   */
  protected isReady(): boolean {
    return this.status === 'ready' || this.status === 'running';
  }

  /**
   * Helper method to validate command data
   */
  protected validateCommandData(data: CommandData, requiredFields: string[]): boolean {
    return requiredFields.every(field => data.hasOwnProperty(field));
  }
}