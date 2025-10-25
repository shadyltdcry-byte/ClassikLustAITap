/**
 * toast.ts - Toast Notification System (Utilities Only)
 * Last Edited: 2025-10-24 by Assistant - FIXED: Removed JSX from .ts file
 */

export interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom';
  className?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
  duration: number;
}

/**
 * 🍞 SIMPLE TOAST SYSTEM
 * Shows temporary notifications above all content
 */
class ToastManager {
  private static instance: ToastManager;
  private toasts: Toast[] = [];
  private listeners: ((toasts: Toast[]) => void)[] = [];
  
  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }
  
  /**
   * 🎆 SHOW TOAST
   */
  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', options: ToastOptions = {}): string {
    const id = Math.random().toString(36).substr(2, 9);
    const duration = options.duration || (type === 'error' ? 5000 : 3000);
    
    const toast: Toast = {
      id,
      message,
      type,
      timestamp: Date.now(),
      duration
    };
    
    this.toasts.push(toast);
    this.notifyListeners();
    
    // Auto-remove after duration
    setTimeout(() => {
      this.remove(id);
    }, duration);
    
    return id;
  }
  
  /**
   * 🗑️ REMOVE TOAST
   */
  remove(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }
  
  /**
   * 🗑️ CLEAR ALL TOASTS
   */
  clear(): void {
    this.toasts = [];
    this.notifyListeners();
  }
  
  /**
   * 📋 GET ALL TOASTS
   */
  getAll(): Toast[] {
    return [...this.toasts];
  }
  
  /**
   * 🔊 SUBSCRIBE TO TOAST CHANGES
   */
  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * 🔔 NOTIFY LISTENERS
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.toasts]);
      } catch (error) {
        console.error('Toast listener error:', error);
      }
    });
  }
}

const toastManager = ToastManager.getInstance();

/**
 * 🍞 TOAST API
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => 
    toastManager.show(message, 'success', options),
    
  error: (message: string, options?: ToastOptions) => 
    toastManager.show(message, 'error', options),
    
  info: (message: string, options?: ToastOptions) => 
    toastManager.show(message, 'info', options),
    
  warning: (message: string, options?: ToastOptions) => 
    toastManager.show(message, 'warning', options),
    
  remove: (id: string) => toastManager.remove(id),
  
  clear: () => toastManager.clear()
};

export default toastManager;