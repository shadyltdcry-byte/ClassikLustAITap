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
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false); // Disabled by default to prevent spam
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const errorLogBufferRef = useRef<DebugLog[]>([]);
  const autoSaveCooldownRef = useRef(false);
  const hasAutoSavedThisSession = useRef(false);
  const initializationAttemptedRef = useRef(false);

  useEffect(() => {
    // Initialize DebuggerCore if not already loaded
    const initDebugger = async () => {
      if (typeof window !== 'undefined') {
        // Prevent multiple initialization attempts
        if (initializationAttemptedRef.current) {
          return;
        }
        initializationAttemptedRef.current = true;

        // Check if already initialized
        if ((window as any).debuggerCore) {
          if (!(window as any).debuggerInitialized) {
            addLog('success', 'Debugger', 'Debugger Core already connected');
            (window as any).debuggerInitialized = true;
          }
          setIsInitialized(true);
          return;
        }

        try {
          // Mark as initializing to prevent race conditions
          if ((window as any).debuggerInitializing) {
            addLog('warn', 'Debugger', 'Debugger initialization already in progress...');
            return;
          }
          (window as any).debuggerInitializing = true;

          addLog('info', 'Debugger', 'Starting debugger initialization...');

          // Try to dynamically import DebuggerCore
          let DebuggerCore;
          try {
            const module = await import('/client/src/debugger/DebuggerCore.js');
            DebuggerCore = module.default;
          } catch (importError) {
            // Fallback import path
            try {
              const module = await import('../../../debugger/DebuggerCore.js');
              DebuggerCore = module.default;
            } catch (fallbackError) {
              throw new Error(`Failed to import DebuggerCore: ${fallbackError}`);
            }
          }

          const core = new DebuggerCore();
          (window as any).debuggerCore = core;
          
          // Load and register modules with better error handling
          const modulePromises = [
            import('/client/src/debugger/modules/database.js').catch(() => null),
            import('/client/src/debugger/modules/character.js').catch(() => null),
            import('/client/src/debugger/modules/aichat.js').catch(() => null),
            import('/client/src/debugger/modules/gameplay.js').catch(() => null),
          ];
          
          const modules = await Promise.all(modulePromises);
          let registeredCount = 0;
          
          modules.forEach((moduleImport, index) => {
            if (moduleImport && moduleImport.default) {
              try {
                const instance = new moduleImport.default();
                core.register(instance);
                registeredCount++;
              } catch (error) {
                addLog('warn', 'Debugger', `Failed to register module ${index}: ${error}`);
              }
            }
          });
          
          await core.initAll();
          (window as any).debuggerInitialized = true;
          (window as any).debuggerInitializing = false;
          setIsInitialized(true);
          addLog('success', 'Debugger', `Debugger Core initialized with ${registeredCount} modules`);
        } catch (error) {
          (window as any).debuggerInitializing = false;
          setIsInitialized(false);
          addLog('error', 'Debugger', `Failed to initialize: ${error}`);
        }
      }
    };

    // Only initialize once when component mounts and is open
    if ((!isEmbedded || isOpen) && !isInitialized) {
      initDebugger();
    }

    // Capture console logs
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog(...args);
      // Filter out excessive logging to prevent spam
      const message = args.join(' ');
      if (!message.includes('debugger-logs-') && !message.includes('Auto-saved')) {
        addLog('info', 'System', message);
      }
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
      event.preventDefault();
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
        if (!response.ok && !args[0].toString().includes('debugger')) {
          addLog('error', 'Network', `HTTP ${response.status} - ${args[0]}`);
        }
        return response;
      } catch (error: any) {
        if (!args[0].toString().includes('debugger')) {
          addLog('critical', 'Network', `Fetch failed: ${args[0]} - ${error.message}`, error.stack);
        }
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
  }, [isOpen, isEmbedded, isInitialized]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

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
    
    // Improved auto-save logic with proper session management
    if (level === 'error' || level === 'critical') {
      errorLogBufferRef.current.push(newLog);
      
      // Only auto-save if explicitly enabled and conditions are met
      if (
        autoSaveEnabled &&
        errorLogBufferRef.current.length >= 25 &&
        !autoSaveCooldownRef.current &&
        !hasAutoSavedThisSession.current
      ) {
        hasAutoSavedThisSession.current = true;
        autoSaveCooldownRef.current = true;
        saveLogsToFile(errorLogBufferRef.current, 'auto');
        errorLogBufferRef.current = [];
        // Longer cooldown to prevent spam
        setTimeout(() => { 
          autoSaveCooldownRef.current = false; 
        }, 30000); // 30 second cooldown
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
    
    if (type === 'manual') {
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
    errorLogBufferRef.current = [];
    hasAutoSavedThisSession.current = false;
    addLog('info', 'System', 'Logs cleared');
  };

  const reloadPlugins = async () => {
    addLog('info', 'System', 'Reloading plugins...');
    if (typeof window !== 'undefined' && (window as any).debuggerCore) {
      try {
        await (window as any).debuggerCore.stopAll();
        await (window as any).debuggerCore.initAll();
        addLog('success', 'System', 'Plugins reloaded');
      } catch (error) {
        addLog('error', 'System', `Failed to reload plugins: ${error}`);
      }
    } else {
      addLog('error', 'System', 'Debugger Core not available for reload');
    }
  };

  const toggleAutoSave = () => {
    setAutoSaveEnabled(!autoSaveEnabled);
    addLog('info', 'System', `Auto-save ${!autoSaveEnabled ? 'enabled' : 'disabled'}`);
  };

  const getLevelColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'critical': return 'bg-red-800/30 text-red-300 border-red-700/50';
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Debug Console</span>
              <Badge variant="outline" className={isInitialized ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                {isInitialized ? 'Ready' : 'Initializing'}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={toggleAutoSave} className="text-xs">
                <Save className="w-3 h-3" />
                {autoSaveEnabled ? 'ON' : 'OFF'}
              </Button>
              <Button size="sm" variant="ghost" onClick={exportAllLogs}>
                <Download className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={clearLogs}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-64 bg-black/30 rounded p-2" ref={scrollRef}>
            {logs.length === 0 ? (
              <div className="text-gray-500 text-xs text-center py-4">No logs yet...</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex items-start gap-2 mb-1 text-xs">
                  <Badge variant="outline" className={getLevelColor(log.level)}>
                    {log.level}
                  </Badge>
                  <span className="text-gray-400">{log.timestamp}</span>
                  <span className="text-purple-400">[{log.module}]</span>
                  <span className="text-gray-300 flex-1">{log.message}</span>
                </div>
              ))
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCommand()}
              placeholder="Enter command... (e.g., status, clearCache)"
              className="bg-black/30 border-purple-500/30 text-white text-xs"
              disabled={!isInitialized}
            />
            <Button onClick={handleCommand} size="sm" disabled={!isInitialized}>Run</Button>
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
              <Badge variant="outline" className={isInitialized ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                {isInitialized ? 'Ready' : 'Init'}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={toggleAutoSave}>
                <Save className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={exportAllLogs}>
                <Download className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={reloadPlugins}>
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={clearLogs}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
              {onClose && (
                <Button size="sm" variant="ghost" onClick={onClose}>
                  ×
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="space-y-2">
            <ScrollArea className="h-64 bg-black/30 rounded p-2" ref={scrollRef}>
              {logs.length === 0 ? (
                <div className="text-gray-500 text-xs text-center py-4">No logs yet...</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 mb-1 text-xs">
                    <Badge variant="outline" className={getLevelColor(log.level)}>
                      {log.level}
                    </Badge>
                    <span className="text-gray-400">{log.timestamp}</span>
                    <span className="text-purple-400">[{log.module}]</span>
                    <span className="text-gray-300 flex-1">{log.message}</span>
                  </div>
                ))
              )}
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCommand()}
                placeholder="Enter command... (e.g., status, clearCache)"
                className="bg-black/30 border-purple-500/30 text-white"
                disabled={!isInitialized}
              />
              <Button onClick={handleCommand} size="sm" disabled={!isInitialized}>Run</Button>
            </div>

            <div className="text-xs text-gray-400">
              Status: {logs.length} logs | Auto-save: {autoSaveEnabled ? 'ON' : 'OFF'} | {isInitialized ? 'Ready' : 'Initializing...'}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}