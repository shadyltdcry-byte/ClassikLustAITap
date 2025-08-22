/**
 * DebugPlugin.js
 * 
 * Base class / contract all plugins must follow.
 * 
 * What it does:
 *   ✅ Defines expected structure: name, init(), start(), stop()
 *   ✅ Enforces consistency across modules
 *   ❌ Does not implement actual logic (plugins extend this)
 */

// DebuggerPlugin.js
class DebuggerPlugin {
  constructor(name) {
    this.name = name;
  }

  async init(core) {
    // Prepare module; connect to core if needed
    throw new Error('init() must be implemented by subclass');
  }

  async run(command, data) {
    // Handle commands relevant to the plugin
    throw new Error('run() must be implemented by subclass');
  }

  async stop() {
    // Clean shutdown tasks
    throw new Error('stop() must be implemented by subclass');
  }
}

module.exports = DebuggerPlugin;
