/**
 * Luna Error Monitor - AI Debugging Assistant
 * Monitors system errors and alerts admin through Luna character
 */

export interface ErrorReport {
  id: string;
  timestamp: Date;
  type: 'error' | 'warning' | 'critical';
  component: string;
  message: string;
  stack?: string;
  userId?: string;
  resolved: boolean;
}

export class LunaErrorMonitor {
  private static instance: LunaErrorMonitor;
  private errors: ErrorReport[] = [];
  private isEnabled = false;
  private adminUserId: string | null = null;
  private maxErrors = 50; // Keep last 50 errors

  static getInstance(): LunaErrorMonitor {
    if (!LunaErrorMonitor.instance) {
      LunaErrorMonitor.instance = new LunaErrorMonitor();
    }
    return LunaErrorMonitor.instance;
  }

  enableForAdmin(adminUserId: string) {
    this.adminUserId = adminUserId;
    this.isEnabled = true;
    console.log(`🌙 Luna Error Monitor activated for admin: ${adminUserId}`);
  }

  disable() {
    this.isEnabled = false;
    this.adminUserId = null;
    console.log('🌙 Luna Error Monitor disabled');
  }

  reportError(type: ErrorReport['type'], component: string, message: string, error?: Error, userId?: string) {
    if (!this.isEnabled) return;

    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      component,
      message,
      stack: error?.stack,
      userId,
      resolved: false
    };

    // Add to errors list
    this.errors.unshift(errorReport);
    
    // Keep only latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Create Luna's alert message
    this.generateLunaAlert(errorReport);
  }

  private generateLunaAlert(error: ErrorReport) {
    const severity = error.type === 'critical' ? '🚨 CRITICAL' : 
                    error.type === 'error' ? '❌ ERROR' : '⚠️ WARNING';
    
    const lunaMessage = this.createLunaPersonalizedMessage(error);
    
    console.log(`🌙 [Luna Alert] ${severity}: ${lunaMessage}`);
    
    // If we have a chat system, we could send this to Luna's chat
    this.saveLunaChatMessage(lunaMessage, error.type);
  }

  private createLunaPersonalizedMessage(error: ErrorReport): string {
    const timeStr = error.timestamp.toLocaleTimeString();
    
    const messages = {
      error: [
        `Master, I detected an error in ${error.component} at ${timeStr}. ${error.message}`,
        `Something's wrong with ${error.component}, Master! ${error.message} happened at ${timeStr}.`,
        `Hey there! I found an issue with ${error.component}: ${error.message}. Time: ${timeStr}`,
      ],
      warning: [
        `Master, just a heads up - there's a warning in ${error.component}: ${error.message}`,
        `I noticed something unusual in ${error.component} at ${timeStr}. ${error.message}`,
        `Hmm, ${error.component} is acting a bit strange. ${error.message} (${timeStr})`,
      ],
      critical: [
        `🚨 URGENT! Master, there's a critical issue with ${error.component}! ${error.message}`,
        `Master, we have a serious problem! ${error.component} is failing: ${error.message}`,
        `Emergency alert! ${error.component} has a critical error: ${error.message}`,
      ]
    };

    const randomIndex = Math.floor(Math.random() * messages[error.type].length);
    return messages[error.type][randomIndex];
  }

  private async saveLunaChatMessage(message: string, severity: string) {
    // Send Luna's alert directly to your chat using the existing chat API
    if (!this.adminUserId) return;
    
    try {
      // Use the working chat API to add Luna's message
      const response = await fetch('http://localhost:5000/api/chat/telegram_5134006535/550e8400-e29b-41d4-a716-446655440002', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          isFromUser: false, // Luna is sending the message
          type: 'text',
          mood: 'alert'
        })
      });
      
      if (response.ok) {
        console.log(`💬 ✅ Luna sent error alert to your chat!`);
      } else {
        console.log(`🌙 Luna Alert (API failed): ${message}`);
      }
    } catch (error) {
      // Fallback to console if API fails
      console.log(`🌙 Luna Alert: ${message}`);
    }
  }

  getRecentErrors(limit = 10): ErrorReport[] {
    return this.errors.slice(0, limit);
  }

  getErrorStats() {
    const total = this.errors.length;
    const unresolved = this.errors.filter(e => !e.resolved).length;
    const critical = this.errors.filter(e => e.type === 'critical').length;
    
    return { total, unresolved, critical, resolved: total - unresolved };
  }

  markErrorResolved(errorId: string) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      console.log(`🌙 Luna: Error ${errorId} marked as resolved`);
    }
  }

  clearOldErrors() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.errors = this.errors.filter(e => e.timestamp > oneHourAgo && !e.resolved);
  }
}

// Global error handlers that Luna can monitor
export function setupLunaErrorHandlers() {
  const monitor = LunaErrorMonitor.getInstance();
  
  // Monitor unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    monitor.reportError('critical', 'System', `Unhandled Promise Rejection: ${reason}`, reason as Error);
  });
  
  // Monitor uncaught exceptions
  process.on('uncaughtException', (error) => {
    monitor.reportError('critical', 'System', `Uncaught Exception: ${error.message}`, error);
  });
}

// Helper function to report errors from anywhere in the app
export function reportToLuna(type: ErrorReport['type'], component: string, message: string, error?: Error, userId?: string) {
  try {
    const monitor = LunaErrorMonitor.getInstance();
    monitor.reportError(type, component, message, error, userId);
  } catch (lunaError) {
    console.error('Luna reporting failed:', lunaError);
  }
}