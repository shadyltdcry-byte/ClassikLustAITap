/**
 * DebugAssist.js
 * 
 * Acts as an **extension handler** for DebuggerCore.
 * - Lets you inject new plugins dynamically
 * - Provides debugging utilities (logs, tracing, profiling, etc.)
 * 
 * What it does:
 *   ✅ Add/Remove plugins on the fly
 *   ✅ Provide developer tools (debug logs, timers, warnings)
 *   ❌ Does not initialize or orchestrate (that’s Core’s job)
 */

class DebuggerAssist {
  constructor(core, options = {}) {
    this.core = core;
    this.options = options; // Options can include mistralClient or API configs
  }

  async sendToMistralAPI(debugPayload) {
    try {
      const response = await fetch('/api/mistral/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debugPayload),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to send data to MistralAI:', error);
      return null;
    }
  }

  async reportError(pluginName, stage, error) {
    // If mistralClient is provided, forward error logs for AI analysis
    if (this.options.mistralClient) {
      try {
        const debugPayload = {
          code: error.codeSnippet || '',
          error: error.message,
          context: error.context || '',
          language: error.language || 'typescript',
          debugType: 'runtime',
        };
        const response = await this.sendToMistralAPI(debugPayload);
        console.log(`[Yellow] MistralAI response for ${pluginName}:`, response);
      } catch (e) {
        console.error(`[Red] MistralAI error report failed: ${e.message}`);
      }
    }
  }

  // You can extend this class with additional helper utilities,
  // like plugin health monitoring or dynamic plugin injection.
}

class DebuggerAssist {
  constructor(core, options = {}) {
    this.core = core;
    this.options = options; // Options can include mistralClient or API configs
  }

  async sendToMistralAPI(debugPayload) {
    try {
      const response = await fetch('/api/mistral/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debugPayload),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to send data to MistralAI:', error);
      return null;
    }
  }

  async reportError(pluginName, stage, error) {
    // If mistralClient is provided, forward error logs for AI analysis
    if (this.options.mistralClient) {
      try {
        const debugPayload = {
          code: error.codeSnippet || '',
          error: error.message,
          context: error.context || '',
          language: error.language || 'typescript',
          debugType: 'runtime',
        };
        const response = await this.sendToMistralAPI(debugPayload);
        console.log(`[Yellow] MistralAI response for ${pluginName}:`, response);
      } catch (e) {
        console.error(`[Red] MistralAI error report failed: ${e.message}`);
      }
    }
  }

  // You can extend this class with additional helper utilities,
  // like plugin health monitoring or dynamic plugin injection.
}

module.exports = DebuggerAssist;


module.exports = DebuggerAssist;
