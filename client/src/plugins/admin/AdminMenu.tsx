import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Users, Zap, Bug, Database, Settings } from "lucide-react";
import AdminCharactersPanel from "@/components/admin/AdminCharactersPanel";
import AdminGameplayPanel from "@/components/admin/AdminGameplayPanel";
import AdminDebugPanel from "@/components/admin/AdminDebugPanel";
import AdminSystemPanel from "@/components/admin/AdminSystemPanel";

interface AdminMenuProps {
  onClose?: () => void;
}

export default function AdminMenu({ onClose }: AdminMenuProps) {
  // ADMIN ACCESS CONTROL
  // Allow admin access for development/testing purposes
  const isRegularUser = false; // Set to false to enable admin access

  if (isRegularUser) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md">
          <h3 className="text-white text-xl font-bold mb-4">🔒 Access Denied</h3>
          <p className="text-red-200 mb-4">This is an admin panel. Regular users should use the upgrade tab at the bottom instead.</p>
          <Button onClick={onClose} className="w-full bg-red-600 hover:bg-red-700">
            Close - Use Upgrade Tab Below
          </Button>
        </div>
      </div>
    );
  }
  const [activeTab, setActiveTab] = useState("characters");

  return (
    <Dialog open={true} onOpenChange={() => onClose?.()}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        <DialogHeader className="relative">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Admin Control Panel
          </DialogTitle>
          <Button 
            onClick={onClose}
            className="absolute top-0 right-0 bg-transparent hover:bg-red-600/20 border-none"
            variant="ghost"
            size="sm"
          >
            <X className="w-4 h-4 text-white" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 gap-2 bg-transparent p-2">
              <TabsTrigger 
                value="characters" 
                className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:border-purple-500 rounded-lg transition-all shadow-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Characters
              </TabsTrigger>
              <TabsTrigger 
                value="gameplay" 
                className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:border-purple-500 rounded-lg transition-all shadow-sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                Gameplay
              </TabsTrigger>
              <TabsTrigger 
                value="debug" 
                className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:border-purple-500 rounded-lg transition-all shadow-sm"
              >
                <Bug className="w-4 h-4 mr-2" />
                Debug Tools
              </TabsTrigger>
              <TabsTrigger 
                value="system" 
                className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:border-purple-500 rounded-lg transition-all shadow-sm"
              >
                <Database className="w-4 h-4 mr-2" />
                System
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="characters" className="h-full overflow-y-auto m-0">
                <AdminCharactersPanel />
              </TabsContent>

              <TabsContent value="gameplay" className="h-full overflow-y-auto m-0">
                <AdminGameplayPanel />
              </TabsContent>

              <TabsContent value="debug" className="h-full overflow-y-auto m-0">
                <AdminDebugPanel />
              </TabsContent>

              <TabsContent value="system" className="h-full overflow-y-auto m-0">
                <AdminSystemPanel />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}