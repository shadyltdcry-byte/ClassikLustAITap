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



export default class GameCore { constructor(config = {}) { // Holds references to all loaded modules this.modules = {};

// Centralized configuration
this.config = {
	debug: true,
	...config,
};

// Tracks initialization state
this.initialized = false;

}

/**

Register a new module.

@param {string} name - Identifier for the module (e.g., "database", "ai").

@param {object} module - The module object itself.

Each module must implement:

init(core): called once at load with reference to GameCore


shutdown(): cleanly stop the module */ registerModule(name, module) { if (this.modules[name]) { throw new Error(Module '${name}' already registered.); } this.modules[name] = module; if (this.config.debug) console.log(✅ Registered module: ${name}); }



/**

Initialize all modules in order.

Loading Order (example):

1. database → ensures persistence



2. ai → provides logic & NPC behavior



3. characters → uses DB + AI



4. inventory, quests, misc → depend on characters/AI */ async init() { if (this.initialized) return; try { // Load database first if (this.modules.database) await this.modules.database.init(this);



// Then AI if (this.modules.ai) await this.modules.ai.init(this);

// Then characters if (this.modules.characters) await this.modules.characters.init(this);

// Load everything else for (const [name, mod] of Object.entries(this.modules)) { if (!["database", "ai", "characters"].includes(name)) { await mod.init(this); } }

this.initialized = true; if (this.config.debug) console.log("🚀 GameCore fully initialized."); } catch (err) { console.error("❌ Initialization failed:", err); } }


/**

Shutdown all modules cleanly.

Called when the game is closed or reset. */ 
		 async shutdown() { for (const [name, mod] of Object.entries(this.modules)) { if (typeof mod.shutdown === "function") { await mod.shutdown(); if (this.config.debug) console.log(🛑 Shutdown module: ${name}); } } this.initialized = false; } }


/**

────────── Example of what a Module looks like ─────────

const DatabaseModule = {

async init(core) {

console.log("DB Connected");

this.db = {}; // fake DB placeholder

},

async shutdown() {

console.log("DB Disconnected");

}

};

// Register it:

const core = new GameCore();

core.registerModule("database", DatabaseModule);

core.init();

────────────────────────────────────────────────── */


