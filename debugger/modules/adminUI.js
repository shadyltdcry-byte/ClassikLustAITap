
const DebuggerPlugin = require("../DebuggerPlugin");

class AdminUIPlugin extends DebuggerPlugin {
  constructor() {
    super("AdminUIPlugin");
    this.core = null;
  }

  async init(core) {
    this.core = core;
    this.core.log("[Yellow][AdminUIPlugin] Initialized", "info");
  }

  async run(command, data) {
    if (command === "getAllPluginStats") {
      const stats = {};
      for (const plugin of this.core.plugins) {
        if (plugin.run) {
          stats[plugin.name] = await plugin.run("getStats") || {};
        }
      }
      return stats;
    }
    if (command === "getAllPluginLogs") {
      const logs = {};
      for (const plugin of this.core.plugins) {
        logs[plugin.name] = {
          commands: plugin.commandLogs || [],
          errors: plugin.errorLogs || []
        };
      }
      return logs;
    }
    if (command === "sendPluginCommand") {
      const { pluginName, subCommand, subData } = data;
      const plugin = this.core.plugins.find(p => p.name === pluginName);
      if (!plugin) throw new Error("Plugin not found: " + pluginName);
      return plugin.run(subCommand, subData);
    }
    return null;
  }

  async stop() {
    this.core.log("[Yellow][AdminUIPlugin] Stopped", "info");
  }
}

module.exports = AdminUIPlugin;
