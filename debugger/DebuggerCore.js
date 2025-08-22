/**
 * DebuggerCore.js
 * 
 * The main orchestrator (bootstrapper). 
 * - Loads all modules/plugins.
 * - Provides a shared lifecycle (init, start, stop).
 * - Keeps global context (shared state).
 * 
 * What it does:
 *   ✅ Acts as entry point
 *   ✅ Registers and initializes plugins in correct order
 *   ✅ Provides error handling fallback
 *   ❌ Does not care about actual feature logic (that belongs to plugins)
 

debugger
  ├── DebuggerCore.js          # The main orchestrator	(bootstrap everything)
  ├── DebugAssist.js           # Handles extending core with extra features
  ├── DebugPlugin.js              # Defines plugin contracts/rules
  └── modules/               # Every plugin lives here
       ├── characters.js
       ├── database.js
       ├── aichat.js
       └── gameplay.js
=====================================================
*/

const DebuggerPlugin = require('./DebuggerPlugin');

class DebuggerCore {
  constructor() {
    this.plugins = [];
    this.isInitialized = false;
  }

  register(plugin) {
    if (!(plugin instanceof DebuggerPlugin)) {
      throw new Error('Plugin must extend DebuggerPlugin');
    }
    this.plugins.push(plugin);
  }

  // Color-coded logging helper
  log(message, level = 'info') {
    const colorCodes = {
      info: '\x1b[33m',    // Yellow
      success: '\x1b[32m', // Green
      error: '\x1b[31m'    // Red
    };
    const reset = '\x1b[0m';
    const timestamp = new Date().toISOString();
    const color = colorCodes[level] || colorCodes.info;
    console.log(`${color}[${timestamp}] ${message}${reset}`);
  }

  async initAll() {
    for (const plugin of this.plugins) {
      try {
        await plugin.init(this);
        this.log(`[Green] ${plugin.name} initialized successfully`, 'success');
      } catch (error) {
        this.log(`[Red] ${plugin.name} initialization error: ${error.message}`, 'error');
      }
    }
    this.isInitialized = true;
  }

  async runCommand(command, data) {
    if (!this.isInitialized) {
      throw new Error("DebuggerCore not initialized - call initAll first");
    }

    for (const plugin of this.plugins) {
      try {
        await plugin.run(command, data);
        this.log(`[Green] ${plugin.name} handled command: ${command}`, 'success');
      } catch (error) {
        this.log(`[Red] ${plugin.name} error during command '${command}': ${error.message}`, 'error');
      }
    }
  }

  async stopAll() {
    for (const plugin of this.plugins) {
      try {
        await plugin.stop();
        this.log(`[Green] ${plugin.name} stopped cleanly`, 'success');
      } catch (error) {
        this.log(`[Red] ${plugin.name} error during stop: ${error.message}`, 'error');
      }
    }
  }
}

module.exports = DebuggerCore;
