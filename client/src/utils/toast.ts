/**
 * toast.ts - Toast Notification System
 * Last Edited: 2025-10-24 by Assistant - Simple toast system for user feedback
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
  private container: HTMLDivElement | null = null;
  
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

/**
 * 🔊 TOAST HOOK FOR REACT COMPONENTS
 */
export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  
  React.useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);
  
  return { toasts, toast };
}

/**
 * 🍞 TOAST CONTAINER COMPONENT
 * Add this to your app root to display toasts
 */
export function ToastContainer({ 
  position = 'top',
  className = ''
}: {
  position?: 'top' | 'bottom';
  className?: string;
}) {
  const { toasts } = useToast();
  
  if (toasts.length === 0) {
    return null;
  }
  
  const positionClasses = {
    top: 'top-4',
    bottom: 'bottom-4'
  };
  
  return (
    <div className={`
      fixed ${positionClasses[position]} right-4 left-4
      z-[9999] pointer-events-none
      flex flex-col space-y-2
      ${className}
    `}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

/**
 * 🍞 INDIVIDUAL TOAST COMPONENT
 */
function ToastItem({ toast: toastItem }: { toast: Toast }) {
  const typeStyles = {
    success: 'bg-green-600 text-white border-green-500',
    error: 'bg-red-600 text-white border-red-500',
    warning: 'bg-yellow-600 text-white border-yellow-500',
    info: 'bg-blue-600 text-white border-blue-500'
  };
  
  const typeIcons = {
    success: '✓',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  return (
    <div className={`
      max-w-sm w-full pointer-events-auto
      p-4 rounded-lg shadow-lg border
      animate-in slide-in-from-right duration-300
      ${typeStyles[toastItem.type]}
    `}>
      <div className="flex items-start space-x-3">
        <span className="text-lg flex-shrink-0 mt-0.5">
          {typeIcons[toastItem.type]}
        </span>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">
            {toastItem.message}
          </p>
        </div>
        
        <button
          onClick={() => toastManager.remove(toastItem.id)}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
        >
          <span className="sr-only">Close</span>
          ×
        </button>
      </div>
    </div>
  );
}

export default toastManager;