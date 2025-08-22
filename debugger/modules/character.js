import DebugPlugin from "../DebugPlugin.js";

/**
 * DatabaseModule
 * Handles database connection + context sharing
 */
export class DatabaseModule extends DebugPlugin {
  constructor() {
    super("Database");
  }

  async init(context) {
    context.db = { connected: true, tables: {} }; // mock db
    console.log("[Database] Connected (mock)");
  }
}