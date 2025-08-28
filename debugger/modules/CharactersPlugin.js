// debugger/modules/characters.js
const DebuggerPlugin = require("../DebuggerPlugin");
const { SupabaseStorage } = require("../../shared/SupabaseStorage");

class CharactersPlugin extends DebuggerPlugin {
  constructor(storageInstance) {
    super("CharactersPlugin");
    // Accept external storage instance for flexibility/testing
    this.storage = storageInstance || new SupabaseStorage();
    this.charactersCache = new Map();
    this.commandLogs = [];
    this.errorLogs = [];
    this.stats = {
      totalCharacters: 0,
      commandsProcessed: 0,
      errorsCaught: 0,
      lastError: null,
    };
  }

  logCommand(command, data) {
    this.commandLogs.push({ timestamp: new Date().toISOString(), command, data });
    if (this.commandLogs.length > 200) this.commandLogs.shift();
    this.core.log(`[Yellow][CharactersPlugin] Cmd: ${command}`, "info");
  }

  async logError(stage, error) {
    this.errorLogs.push({
      timestamp: new Date().toISOString(),
      stage,
      message: error.message,
      stack: error.stack,
    });
    if (this.errorLogs.length > 100) this.errorLogs.shift();
    this.stats.errorsCaught++;
    this.stats.lastError = error.message;
    this.core.log(`[Red][CharactersPlugin] Error at ${stage}: ${error.message}`, "error");
    try {
      if (this.core.assist) await this.core.assist.reportError(this.name, stage, error);
    } catch {}
  }

  async init(core) {
    this.core = core;
    this.core.log("[Yellow][CharactersPlugin] Initializing...", "info");
    try {
      const allChars = await this.storage.getAllCharacters();
      allChars.forEach((c) => this.charactersCache.set(c.id, c));
      this.stats.totalCharacters = this.charactersCache.size;
      this.core.log(`[Green][CharactersPlugin] Loaded ${this.stats.totalCharacters} characters`, "success");
    } catch (err) {
      await this.logError("init", err);
    }
  }

  async run(command, data) {
    this.stats.commandsProcessed++;
    this.logCommand(command, data);
    try {
      switch (command) {
        case "addCharacter": {
          if (!data || !data.name) throw new Error("Character name required");
          const newChar = await this.storage.createCharacter(data);
          this.charactersCache.set(newChar.id, newChar);
          this.stats.totalCharacters = this.charactersCache.size;
          this.core.log(`[Green][CharactersPlugin] Added ${newChar.name}`, "success");
          return newChar;
        }
        case "updateCharacter": {
          if (!data || !data.id) throw new Error("Character id required");
          const updatedChar = await this.storage.updateCharacter(data.id, data);
          if (updatedChar) this.charactersCache.set(updatedChar.id, updatedChar);
          this.core.log(`[Green][CharactersPlugin] Updated ${updatedChar?.name || data.id}`, "success");
          return updatedChar;
        }
        case "deleteCharacter": {
          if (!data || !data.id) throw new Error("Character id required");
          await this.storage.deleteCharacter(data.id);
          this.charactersCache.delete(data.id);
          this.stats.totalCharacters = this.charactersCache.size;
          this.core.log(`[Green][CharactersPlugin] Deleted id ${data.id}`, "success");
          return true;
        }
        case "getCharacter": {
          return this.charactersCache.get(data.id);
        }
        case "getAllCharacters": {
          return Array.from(this.charactersCache.values());
        }
        case "getStats": {
          return { ...this.stats, cacheSize: this.charactersCache.size };
        }
        case "getCommandLogs": {
          return this.commandLogs;
        }
        case "getErrorLogs": {
          return this.errorLogs;
        }
        default:
          // Ignore unknown commands gracefully
          return null;
      }
    } catch (err) {
      await this.logError("run", err);
      return null;
    }
  }

  async stop() {
    this.core.log("[Yellow][CharactersPlugin] Stopped", "info");
    // Optionally flush cache, close resources here
  }
}

module.exports = CharactersPlugin;
