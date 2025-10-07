import DebugPlugin from "../DebugPlugin.js";

/**
 * AIChatModule
 * Handles NPC/AI Chat logic
 */
export class AIChatModule extends DebugPlugin {
  constructor() {
    super("AIChat");
  }

  async init(context) {
    context.ai = { enabled: true };
    console.log("[AIChat] Initialized (mock)");
  }
}