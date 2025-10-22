import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Terminal, Trash2, RefreshCw, Download, Save, AlertTriangle } from 'lucide-react';

interface DebugLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'critical' | 'ai-summary';
  module: string;
  message: string;
  stack?: string;
  aiAnalysis?: any;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initGuard = useRef(false);
  const eventListenersRef = useRef<{ cleanup: () => void } | null>(null);

  // Single initialization with proper cleanup
  useEffect(() => {
    if (initGuard.current || !isOpen) return;
    initGuard.current = true;

    const initDebugger = async () => {
      try {
        addLog('info', 'Debugger', 'Initializing AI-powered debugger...');
        
        // Initialize DebuggerCore
        const { default: DebuggerCore } = await import('@/debugger/DebuggerCore.js');
        const core = new DebuggerCore();
        (window as any).debuggerCore = core;
        
        // Load modules with proper error handling
        const moduleResults = await Promise.allSettled([
          import('@/debugger/modules/database.js'),
          import('@/debugger/modules/character.js'),
          import('@/debugger/modules/aichat.js'),
          import('@/debugger/modules/gameplay.js'),
        ]);
        
        let loadedModules = 0;
        moduleResults.forEach((result, index) => {
          const moduleNames = ['database', 'character', 'aichat', 'gameplay'];
          if (result.status === 'fulfilled' && result.value.default) {
            try {
              core.register(new result.value.default());
              loadedModules++;
            } catch (e) {
              addLog('warn', 'Debugger', `Failed to register ${moduleNames[index]} module`);
            }
          }
        });
        
        await core.initAll();
        setIsInitialized(true);
        addLog('success', 'Debugger', `AI Debugger ready (${loadedModules}/4 modules)`);
        
        // Setup AI error monitoring
        setupAIErrorMonitoring();
        
      } catch (error: any) {
        addLog('error', 'Debugger', `Initialization failed: ${error.message}`);
      }
    };

    const setupAIErrorMonitoring = () => {
      // Global error capture for AI triage
      const handleError = (event: ErrorEvent) => {
        addLog('critical', 'Frontend', `${event.message} at ${event.filename}:${event.lineno}`);
        sendErrorToTriage({
          severity: 'critical',
          source: 'client',
          message: event.message,
          stack: event.error?.stack,
          details: { filename: event.filename, lineno: event.lineno, colno: event.colno }
        });
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        addLog('critical', 'Promise', message);
        sendErrorToTriage({
          severity: 'critical',
          source: 'client',
          message,
          stack: reason instanceof Error ? reason.stack : undefined,
          details: { type: 'unhandled-promise' }
        });
      };

      // Enhanced fetch monitoring
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args);
          if (!response.ok && !args[0].toString().includes('triage')) {
            const errorMsg = `HTTP ${response.status} - ${args[0]}`;
            addLog('error', 'Network', errorMsg);
            sendErrorToTriage({
              severity: response.status >= 500 ? 'critical' : 'moderate',
              source: 'client',
              route: args[0].toString(),
              method: (args[1] as any)?.method || 'GET',
              status: response.status,
              message: errorMsg,
              details: { url: args[0], options: args[1] }
            });
          }
          return response;
        } catch (error: any) {
          if (!args[0].toString().includes('triage')) {
            addLog('critical', 'Network', `Fetch failed: ${error.message}`);
            sendErrorToTriage({
              severity: 'critical',
              source: 'client',
              message: `Network failure: ${error.message}`,
              stack: error.stack,
              details: { url: args[0], options: args[1] }
            });
          }
          throw error;
        }
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      
      // Setup Luna alert listener
      window.addEventListener('luna-alert', (e: any) => {
        addLog('ai-summary', 'Luna', `🤖 Alert: ${e.detail.severity} issue detected`);
      });

      eventListenersRef.current = {
        cleanup: () => {
          window.removeEventListener('error', handleError);
          window.removeEventListener('unhandledrejection', handleUnhandledRejection);
          window.fetch = originalFetch;
        }
      };
    };

    const sendErrorToTriage = async (eventData: any) => {
      try {
        await fetch('/api/debug/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        });
      } catch (e) {
        // Silent fail - don't create infinite loops
      }
    };

    initDebugger();

    return () => {
      if (eventListenersRef.current) {
        eventListenersRef.current.cleanup();
      }
    };
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (level: DebugLog['level'], module: string, message: string, stack?: string, aiAnalysis?: any) => {
    const newLog: DebugLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      module,
      message,
      stack,
      aiAnalysis
    };
    
    setLogs(prev => [...prev.slice(-199), newLog]); // Keep last 200 logs
  };

  const handleCommand = async () => {
    if (!command.trim()) return;
    
    addLog('info', 'User', `> ${command}`);
    
    try {
      if (command.toLowerCase() === 'ai-analyze') {
        addLog('info', 'AI', 'Requesting AI analysis of recent errors...');
        const response = await fetch('/api/debug/analyze', { method: 'POST' });
        const result = await response.json();
        addLog('ai-summary', 'AI', result.summary || 'Analysis complete');
      } else if ((window as any).debuggerCore) {
        await (window as any).debuggerCore.runCommand(command.split(' ')[0], command.split(' ').slice(1).join(' '));
        addLog('success', 'Debugger', `Executed: ${command}`);
      } else {
        addLog('error', 'Debugger', 'Core not initialized');
      }
    } catch (error: any) {
      addLog('error', 'Command', error.message);
    }
    
    setCommand('');
  };

  const getLevelColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'critical': return 'bg-red-800/30 text-red-300 border-red-700/50';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warn': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ai-summary': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const exportLogs = () => {
    const logData = logs.map(log => `[${log.timestamp}] [${log.level}] [${log.module}] ${log.message}`).join('\n');
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debugger-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'System', 'Logs cleared');
  };

  if (!isOpen) return null;

  const criticalCount = logs.filter(l => l.level === 'critical').length;
  const errorCount = logs.filter(l => l.level === 'error').length;

  if (isEmbedded) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">AI Debug Console</span>
            <Badge variant="outline" className={isInitialized ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
              {isInitialized ? 'AI Ready' : 'Loading'}
            </Badge>
            {criticalCount > 0 && (
              <Badge className="bg-red-500/20 text-red-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {criticalCount} Critical
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={exportLogs}>
              <Download className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={clearLogs}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-64 bg-black/30 rounded p-2 mb-2" ref={scrollRef}>
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-2 mb-1 text-xs">
              <Badge variant="outline" className={getLevelColor(log.level)}>
                {log.level === 'ai-summary' ? '🤖' : log.level}
              </Badge>
              <span className="text-gray-400">{log.timestamp}</span>
              <span className="text-purple-400">[{log.module}]</span>
              <span className="text-gray-300 flex-1">{log.message}</span>
            </div>
          ))}
        </ScrollArea>

        <div className="flex gap-2 mb-2">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCommand()}
            placeholder="Commands: status, ai-analyze, clearCache, reconnect"
            className="bg-black/30 border-purple-500/30 text-white text-xs"
            disabled={!isInitialized}
          />
          <Button onClick={handleCommand} size="sm" disabled={!isInitialized}>Run</Button>
        </div>

        <div className="text-xs text-gray-400 flex justify-between">
          <span>AI Triage: {isInitialized ? 'Active' : 'Initializing'}</span>
          <span>{logs.length} logs | {errorCount + criticalCount} errors</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-gray-900/95 border-purple-500/30 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              AI Debug Console
              <Badge variant="outline" className={isInitialized ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                {isInitialized ? 'Ready' : 'Init'}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={exportLogs}><Download className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" onClick={clearLogs}><Trash2 className="w-3 h-3" /></Button>
              {onClose && <Button size="sm" variant="ghost" onClick={onClose}>×</Button>}
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="space-y-2">
            <ScrollArea className="h-64 bg-black/30 rounded p-2" ref={scrollRef}>
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-2 mb-1 text-xs">
                  <Badge variant="outline" className={getLevelColor(log.level)}>
                    {log.level === 'ai-summary' ? '🤖' : log.level}
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
                placeholder="AI commands: ai-analyze, status, clearCache"
                className="bg-black/30 border-purple-500/30 text-white"
                disabled={!isInitialized}
              />
              <Button onClick={handleCommand} size="sm" disabled={!isInitialized}>Run</Button>
            </div>

            <div className="text-xs text-gray-400">
              AI Triage: Active | {logs.length} logs | {criticalCount} critical, {errorCount} errors
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}