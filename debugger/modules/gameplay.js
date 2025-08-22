import DebugPlugin from "../DebugPlugin.js";

/**
 * GameplayModule
 * Handles rules, mechanics, and flow
 */
export class GameplayModule extends DebugPlugin {
  constructor() {
    super("Gameplay");
  }

  async init(context) {
    context.gameplay = { running: false };
    console.log("[Gameplay] Systems initialized");
  }

  async start() {
    context.gameplay.running = true;
    console.log("[Gameplay] Game loop started");
  }
}