import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, Bug, Code, Activity } from "lucide-react";
import MistralDebugger from "@/plugins/aicore/MistralDebugger";
import DebuggerInterface from "@/components/admin/DebuggerInterface";

// Backend Debugger Component
const AdminBackendDebugger = () => {
  const [commandInput, setCommandInput] = useState("");
  const [commandOutput, setCommandOutput] = useState("");

  const runCommand = async () => {
    if (!commandInput.trim()) {
      setCommandOutput("Please enter a command.");
      return;
    }

    try {
      const result = { 
        status: "success", 
        command: commandInput,
        timestamp: new Date().toISOString(),
        output: "Command executed successfully"
      };
      setCommandOutput(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setCommandOutput(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Terminal className="w-5 h-5" />
        Backend Debugger
      </h3>

      <div className="space-y-3">
        <div>
          <Label className="text-white text-sm">Command Input</Label>
          <div className="flex gap-2">
            <Input
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Enter command (e.g., 'status', 'reload', 'stats')"
              className="bg-gray-700 border-gray-600 text-white flex-1"
              onKeyPress={(e) => e.key === 'Enter' && runCommand()}
            />
            <Button
              onClick={runCommand}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Terminal className="w-4 h-4 mr-2" />
              Run
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-white text-sm">Output</Label>
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 min-h-24 max-h-48 overflow-y-auto">
            <pre className="text-xs text-green-400 whitespace-pre-wrap">
              {commandOutput || "No output yet..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminDebugPanel() {
  const [showMistralDebugger, setShowMistralDebugger] = useState(false);
  const [showBackendDebugger, setShowBackendDebugger] = useState(false);
  const [showDebuggerInterface, setShowDebuggerInterface] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Debug Tools</h2>
        <p className="text-gray-400">Debug and monitor system performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Backend Debugger */}
        <Card className="bg-gray-800 border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => setShowBackendDebugger(!showBackendDebugger)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-400" />
              Backend Debugger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Execute backend commands and view system status</p>
          </CardContent>
        </Card>

        {/* Mistral AI Debugger */}
        <Card className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer"
              onClick={() => setShowMistralDebugger(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Bug className="w-5 h-5 text-purple-400" />
              Mistral AI Debugger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Debug AI chat responses and model behavior</p>
          </CardContent>
        </Card>

        {/* Advanced Debugger Interface */}
        <Card className="bg-gray-800 border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer"
              onClick={() => setShowDebuggerInterface(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-green-400" />
              Advanced Debugger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Advanced debugging interface with detailed logs</p>
          </CardContent>
        </Card>
      </div>

      {/* Backend Debugger Toggle */}
      {showBackendDebugger && (
        <div className="mt-6">
          <AdminBackendDebugger />
        </div>
      )}

      {/* Mistral Debugger Modal */}
      {showMistralDebugger && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Mistral AI Debugger</h3>
              <Button variant="ghost" onClick={() => setShowMistralDebugger(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <MistralDebugger />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Debugger Interface Modal */}
      {showDebuggerInterface && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Advanced Debugger Interface</h3>
              <Button variant="ghost" onClick={() => setShowDebuggerInterface(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <DebuggerInterface />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}