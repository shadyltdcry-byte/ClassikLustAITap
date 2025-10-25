// Client-side auto-repair utilities
// Connects to server-side repair endpoints and applies fixes automatically

interface AutoRepairFix {
  name: string;
  currentImport: string;
  correctImport: string;
  issue: string;
}

interface RepairResult {
  component: string;
  status: 'fixed' | 'failed';
  error?: string;
}

export class AutoRepairClient {
  private static instance: AutoRepairClient;
  
  static getInstance(): AutoRepairClient {
    if (!AutoRepairClient.instance) {
      AutoRepairClient.instance = new AutoRepairClient();
    }
    return AutoRepairClient.instance;
  }

  // Apply fixes via server API
  async applyFixes(fixes: AutoRepairFix[]): Promise<RepairResult[]> {
    try {
      const response = await fetch('/auto-repair/apply-fixes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fixes })
      });

      if (!response.ok) {
        throw new Error(`Auto-repair request failed: ${response.status}`);
      }

      const result = await response.json();
      return result.results || [];
    } catch (error) {
      console.error('Auto-repair client error:', error);
      throw error;
    }
  }

  // Get current import status
  async getCurrentStatus(): Promise<any> {
    try {
      const response = await fetch('/auto-repair/status');
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to get repair status:', error);
      throw error;
    }
  }

  // Enhanced auto-fix with progress tracking
  async performAutoRepair(progressCallback?: (progress: string) => void): Promise<boolean> {
    try {
      progressCallback?.('Analyzing component imports...');
      
      // Get fixes from boot probe results
      const bootProbe = (window as any).__BOOT_PROBE__;
      const autoFixes = (window as any).__AUTO_REPAIR_FIXES__ || [];
      
      if (autoFixes.length === 0) {
        progressCallback?.('No fixes needed - all components working!');
        return true;
      }

      progressCallback?.(`Applying ${autoFixes.length} auto-fixes...`);
      
      // Apply fixes via server
      const results = await this.applyFixes(autoFixes);
      
      // Check results
      const successful = results.filter(r => r.status === 'fixed');
      const failed = results.filter(r => r.status === 'failed');
      
      if (failed.length > 0) {
        progressCallback?.(`Partial success: ${successful.length} fixed, ${failed.length} failed`);
        console.warn('Some auto-repairs failed:', failed);
        return false;
      }

      progressCallback?.(`Success: ${successful.length} components auto-repaired!`);
      
      // Schedule page reload to test fixes
      setTimeout(() => {
        progressCallback?.('Reloading to test fixes...');
        window.location.reload();
      }, 2000);
      
      return true;
      
    } catch (error) {
      progressCallback?.(`Auto-repair failed: ${error}`);
      console.error('Auto-repair failed:', error);
      return false;
    }
  }

  // Setup auto-repair from boot probe overlay
  setupAutoRepairUI() {
    // Wire the auto-fix button from the boot probe overlay
    (window as any).__applyAutoFixes = async () => {
      const progressDiv = document.createElement('div');
      progressDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999999;background:#001122;color:#00ff88;border:2px solid #00aa55;padding:20px;border-radius:8px;font-family:monospace;text-align:center;';
      progressDiv.innerHTML = '<div style="font-size:16px;margin-bottom:10px;">🚀 AUTO-REPAIR IN PROGRESS</div><div id="repair-progress">Starting...</div>';
      document.body.appendChild(progressDiv);

      const updateProgress = (message: string) => {
        const progressEl = document.getElementById('repair-progress');
        if (progressEl) {
          progressEl.textContent = message;
        }
      };

      try {
        const success = await this.performAutoRepair(updateProgress);
        
        if (success) {
          updateProgress('✅ Auto-repair complete! Reloading...');
        } else {
          updateProgress('⚠️ Some repairs failed. Check console.');
        }
      } catch (error) {
        updateProgress(`❌ Auto-repair failed: ${error}`);
      }
    };
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  const client = AutoRepairClient.getInstance();
  client.setupAutoRepairUI();
  
  // Expose for debugging
  (window as any).__autoRepairClient = client;
}
