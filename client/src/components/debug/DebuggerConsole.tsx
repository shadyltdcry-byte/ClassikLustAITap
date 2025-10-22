
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Terminal, Trash2, RefreshCw, ChevronDown, ChevronUp, Download, Save } from 'lucide-react';

interface DebugLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'critical';
  module: string;
  message: string;
  stack?: string;
}

interface DebuggerConsoleProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export default function DebuggerConsole({ isOpen = true, onClose, isEmbedded = false }: DebuggerConsoleProps) {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [command, setCommand] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const errorLogBufferRef = useRef<DebugLog[]>([]);

  useEffect(() => {
    // Initialize DebuggerCore if not already loaded
    const initDebugger = async () => {
      if (typeof window !== 'undefined') {
        // Check if already initialized
        if ((window as any).debuggerCore) {
          if (!(window as any).debuggerInitialized) {
            addLog('success', 'Debugger', 'Debugger Core already connected');
            (window as any).debuggerInitialized = true;
          }
          return;
        }

        try {
          // Mark as initializing to prevent race conditions
          if ((window as any).debuggerInitializing) {
            return;
          }
          (window as any).debuggerInitializing = true;

          // Dynamically import and initialize DebuggerCore
          const DebuggerCore = (await import('@/debugger/DebuggerCore.js')).default;
          const core = new DebuggerCore();
          (window as any).debuggerCore = core;
          
          // Load and register modules
          const modules = [
            (await import('@/debugger/modules/database.js')).default,
            (await import('@/debugger/modules/character.js')).default,
            (await import('@/debugger/modules/aichat.js')).default,
            (await import('@/debugger/modules/gameplay.js')).default,
          ];
          
          modules.forEach(ModuleClass => {
            const instance = new ModuleClass();
            core.register(instance);
          });
          
          await core.initAll();
          (window as any).debuggerInitialized = true;
          (window as any).debuggerInitializing = false;
          addLog('success', 'Debugger', 'Debugger Core initialized successfully');
        } catch (error) {
          (window as any).debuggerInitializing = false;
          addLog('error', 'Debugger', `Failed to initialize: ${error}`);
        }
      }
    };

    // Only initialize once when component mounts
    if (!isEmbedded || isOpen) {
      initDebugger();
    }

    // Capture console logs
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
  

    console.log = (...args) => {
      originalLog(...args);
      addLog('info', 'System', args.join(' '));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', 'System', args.join(' '));
    };

    console.error = (...args) => {
      originalError(...args);
      const errorMessage = args.join(' ');
      const stack = args.find(arg => arg instanceof Error)?.stack;
      addLog('error', 'System', errorMessage, stack);
    };

    // Capture uncaught errors
    const handleError = (event: ErrorEvent) => {
      const errorMsg = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
      addLog('critical', 'Uncaught Error', errorMsg, event.error?.stack);
      event.preventDefault(); // Prevent default browser error handling
    };

    // Capture unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      addLog('critical', 'Unhandled Promise', message, stack);
      event.preventDefault();
    };

    // Capture network errors (fetch failures)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          addLog('error', 'Network', `HTTP ${response.status} - ${args[0]}`);
        }
        return response;
      } catch (error: any) {
        addLog('critical', 'Network', `Fetch failed: ${args[0]} - ${error.message}`, error.stack);
        throw error;
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      window.fetch = originalFetch;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

    const autoSaveCooldownRef = useRef(false);
  
  const addLog = (level: DebugLog['level'], module: string, message: string, stack?: string) => {
    const newLog: DebugLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      module,
      message,
      stack
    };
    setLogs(prev => [...prev.slice(-99), newLog]); // Keep last 100 logs
    
  // Place the buffer logic for throttled autosave here:
    if (level === 'error' || level === 'critical') {
      errorLogBufferRef.current.push(newLog);
const hasAutoSavedThisSession = useRef(false);
      // The new throttled auto-save:
      // In addLog, after checking cooldown:
      if (
        autoSaveEnabled &&
        errorLogBufferRef.current.length >= 25 &&
        !autoSaveCooldownRef.current &&
        !hasAutoSavedThisSession.current
      ) {
        hasAutoSavedThisSession.current = true;
        autoSaveCooldownRef.current = true;
        saveLogsToFile(errorLogBufferRef.current, 'manual');
        errorLogBufferRef.current = [];
        setTimeout(() => { autoSaveCooldownRef.current = false; }, 3000);
      }
    }
  };

  const saveLogsToFile = (logsToSave: DebugLog[], type: 'auto' | 'manual' = 'manual') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `debugger-logs-${type}-${timestamp}.txt`;
    
    let logContent = `=== Debugger Logs (${type === 'auto' ? 'Auto-saved' : 'Manual Export'}) ===\n`;
    logContent += `Generated: ${new Date().toLocaleString()}\n`;
    logContent += `Total Logs: ${logsToSave.length}\n`;
    logContent += '='.repeat(50) + '\n\n';
    
    logsToSave.forEach(log => {
      logContent += `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.module}]\n`;
      logContent += `  ${log.message}\n`;
      if (log.stack) {
        logContent += `  Stack: ${log.stack}\n`;
      }
      logContent += '\n';
    });
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    if (type === 'auto') {
      addLog('success', 'System', `Auto-saved ${logsToSave.length} error logs to ${filename}`);
    } else {
      addLog('success', 'System', `Exported ${logsToSave.length} logs to ${filename}`);
    }
  };

  const exportAllLogs = () => {
    if (logs.length === 0) {
      addLog('warn', 'System', 'No logs to export');
      return;
    }
    saveLogsToFile(logs, 'manual');
  };

  const handleCommand = async () => {
    if (!command.trim()) return;

    addLog('info', 'User', `> ${command}`);

    // Execute debugger commands
    if (typeof window !== 'undefined' && (window as any).debuggerCore) {
      try {
        const parts = command.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const data = parts.slice(1).join(' ');

        // Execute the command
        const result = await (window as any).debuggerCore.runCommand(cmd, data);
        
        if (result !== undefined && result !== null) {
          addLog('success', 'Debugger', `${cmd}: ${JSON.stringify(result)}`);
        } else {
          addLog('success', 'Debugger', `Command executed: ${cmd}`);
        }
      } catch (error: any) {
        addLog('error', 'Debugger', error?.message || 'Command execution failed');
      }
    } else {
      addLog('error', 'Debugger', 'Debugger Core not initialized. Please refresh the page.');
    }

    setCommand('');
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'System', 'Logs cleared');
  };

  const reloadPlugins = async () => {
    addLog('info', 'System', 'Reloading plugins...');
    if (typeof window !== 'undefined' && (window as any).debuggerCore) {
      await (window as any).debuggerCore.stopAll();
      await (window as any).debuggerCore.initAll();
      addLog('success', 'System', 'Plugins reloaded');
    }
  };

  const getLevelColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warn': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  if (!isOpen) return null;

  // Embedded mode - render without fixed positioning
  if (isEmbedded) {
    return (
      <div className="w-full">
        <div className="space-y-2">
          <ScrollArea className="h-64 bg-black/30 rounded p-2" ref={scrollRef}>
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-2 mb-1 text-xs">
                <Badge variant="outline" className={getLevelColor(log.level)}>
                  {log.level}
                </Badge>
                <span className="text-gray-400">{log.timestamp}</span>
                <span className="text-purple-400">[{log.module}]</span>
                <span className="text-gray-300 flex-1">{log.message}</span>
              </div>
            ))}
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCommand()}
              placeholder="Enter command... (e.g., status, clearCache)"
              className="bg-black/30 border-purple-500/30 text-white"
            />
            <Button onClick={handleCommand} size="sm">Run</Button>
            <Button size="sm" variant="ghost" onClick={clearLogs}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          <div className="text-xs text-gray-400">
            Available: status, clearCache, reconnect, list, add, chat, clearHistory
          </div>
        </div>
      </div>
    );
  }

  // Floating mode - original behavior
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-gray-900/95 border-purple-500/30 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Debugger Console
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={reloadPlugins}>
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={clearLogs}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="space-y-2">
            <ScrollArea className="h-64 bg-black/30 rounded p-2" ref={scrollRef}>
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-2 mb-1 text-xs">
                  <Badge variant="outline" className={getLevelColor(log.level)}>
                    {log.level}
                  </Badge>
                  <span className="text-gray-400">{log.timestamp}</span>
                  <span className="text-purple-400">[{log.module}]</span>
                  <span className="text-gray-300 flex-1">{log.message}</span>
                </div>
              ))}
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCommand()}
                placeholder="Enter command... (e.g., status, clearCache)"
                className="bg-black/30 border-purple-500/30 text-white"
              />
              <Button onClick={handleCommand} size="sm">Run</Button>
            </div>

            <div className="text-xs text-gray-400">
              Available: status, clearCache, reconnect, list, add, chat, clearHistory
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
