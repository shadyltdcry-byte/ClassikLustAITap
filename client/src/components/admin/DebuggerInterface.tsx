/**
 * DebuggerInterface - React component to interact with the debugger system
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Terminal, 
  Bug, 
  Settings, 
  Activity, 
  CheckCircle, 
  XCircle,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiRequest } from '@/lib/queryClient';

interface DebuggerStatus {
  initialized: boolean;
  plugins: Array<{
    name: string;
    status: any;
  }>;
  logs: Array<{
    timestamp: string;
    command: string;
    data: any;
  }>;
}

export default function DebuggerInterface() {
  const [command, setCommand] = useState('');
  const [commandData, setCommandData] = useState('{}');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const queryClient = useQueryClient();

  // Get debugger status
  const { data: status, isLoading } = useQuery<DebuggerStatus>({
    queryKey: ['/api/admin/debugger/status'],
    refetchInterval: false, // DISABLED - Was causing API spam every 2 seconds
  });

  // Initialize debugger
  const initMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/debugger/init', 'POST');
    },
    onSuccess: () => {
      toast.success('Debugger system initialized');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/debugger/status'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to initialize: ${error.message}`);
    },
  });

  // Stop debugger
  const stopMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/debugger/stop', 'POST');
    },
    onSuccess: () => {
      toast.success('Debugger system stopped');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/debugger/status'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to stop: ${error.message}`);
    },
  });

  // Run command
  const commandMutation = useMutation({
    mutationFn: async (payload: { command: string; data: any }) => {
      return await apiRequest('/api/admin/debugger/command', 'POST', payload);
    },
    onSuccess: (result) => {
      toast.success('Command executed successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/debugger/status'] });
      console.log('Command result:', result);
    },
    onError: (error: any) => {
      toast.error(`Command failed: ${error.message}`);
    },
  });

  const handleRunCommand = () => {
    if (!command.trim()) {
      toast.error('Please enter a command');
      return;
    }

    try {
      const data = JSON.parse(commandData);
      commandMutation.mutate({ command: command.trim(), data });
    } catch (error) {
      toast.error('Invalid JSON in command data');
    }
  };

  const getStatusIcon = (pluginStatus: any) => {
    if (typeof pluginStatus === 'object' && pluginStatus.errorsCaught > 0) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusBadgeVariant = (initialized: boolean) => {
    return initialized ? 'default' : 'secondary';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <Activity className="w-6 h-6 animate-spin text-pink-500" />
          <span className="ml-2 text-white">Loading debugger status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bug className="w-6 h-6 text-pink-500" />
          <h2 className="text-xl font-bold text-white">Debugger System</h2>
          <Badge variant={getStatusBadgeVariant(status?.initialized || false)}>
            {status?.initialized ? 'Running' : 'Stopped'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            data-testid="button-auto-refresh"
          >
            <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          {status?.initialized ? (
            <Button
              onClick={() => stopMutation.mutate()}
              variant="destructive"
              size="sm"
              disabled={stopMutation.isPending}
              data-testid="button-stop-debugger"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop System
            </Button>
          ) : (
            <Button
              onClick={() => initMutation.mutate()}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
              disabled={initMutation.isPending}
              data-testid="button-init-debugger"
            >
              <Play className="w-4 h-4 mr-2" />
              Initialize System
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plugin Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Plugin Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status?.plugins?.length ? (
              <div className="space-y-3">
                {status.plugins.map((plugin, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(plugin.status)}
                      <span className="text-white font-medium">{plugin.name}</span>
                    </div>
                    <div className="text-right">
                      {typeof plugin.status === 'object' ? (
                        <div className="text-xs text-gray-400">
                          <div>Commands: {plugin.status.commandsProcessed || 0}</div>
                          {plugin.status.errorsCaught > 0 && (
                            <div className="text-red-400">Errors: {plugin.status.errorsCaught}</div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {plugin.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                No plugins loaded
              </div>
            )}
          </CardContent>
        </Card>

        {/* Command Interface */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-green-500" />
              Command Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="command" className="text-white">Command</Label>
              <Input
                id="command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g., addCharacter, getStats"
                className="bg-gray-700 border-gray-600 text-white"
                disabled={!status?.initialized}
                data-testid="input-command"
              />
            </div>
            
            <div>
              <Label htmlFor="commandData" className="text-white">Command Data (JSON)</Label>
              <Textarea
                id="commandData"
                value={commandData}
                onChange={(e) => setCommandData(e.target.value)}
                placeholder='{"name": "Test Character", "level": 1}'
                className="bg-gray-700 border-gray-600 text-white h-24"
                disabled={!status?.initialized}
                data-testid="textarea-command-data"
              />
            </div>
            
            <Button
              onClick={handleRunCommand}
              className="w-full bg-pink-600 hover:bg-pink-700"
              disabled={!status?.initialized || commandMutation.isPending}
              data-testid="button-run-command"
            >
              <Terminal className="w-4 h-4 mr-2" />
              {commandMutation.isPending ? 'Running...' : 'Run Command'}
            </Button>
            
            {/* Quick Commands */}
            <div className="pt-2 border-t border-gray-600">
              <p className="text-sm text-gray-400 mb-2">Quick Commands:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { cmd: 'getStats', data: '{}' },
                  { cmd: 'getAllCharacters', data: '{}' },
                  { cmd: 'getCommandLogs', data: '{}' },
                ].map((quick, index) => (
                  <Button
                    key={index}
                    onClick={() => {
                      setCommand(quick.cmd);
                      setCommandData(quick.data);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={!status?.initialized}
                  >
                    {quick.cmd}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Command Logs */}
      {status?.logs && status.logs.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-yellow-500" />
              Recent Command Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {(status?.logs || []).slice(-10).reverse().map((log, index) => (
                  <div key={index} className="p-2 bg-gray-700/30 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-pink-400 font-mono">{log.command}</span>
                      <span className="text-xs text-gray-400">{log.timestamp}</span>
                    </div>
                    <div className="text-gray-300 text-xs mt-1">
                      {JSON.stringify(log.data)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}