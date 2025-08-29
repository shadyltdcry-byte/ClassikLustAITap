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
  // BLOCK ALL NON-ADMIN ACCESS - SECURITY FIX
  // Only allow authorized admin access - regular users should NOT see this
  const isRegularUser = true; // This should be a regular user, not admin
  
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
      <DialogContent className="max-w-7xl h-[90vh] bg-gray-900 border-gray-700">
        <DialogHeader className="border-b border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Admin Control Panel</DialogTitle>
                <p className="text-sm text-gray-400">Manage characters, gameplay, debug tools, and system settings</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="bg-gray-800/50 border border-gray-700/50 mb-4">
              <TabsTrigger value="characters" className="data-[state=active]:bg-purple-600">
                <Users className="w-4 h-4 mr-2" />
                Characters
              </TabsTrigger>
              <TabsTrigger value="gameplay" className="data-[state=active]:bg-purple-600">
                <Zap className="w-4 h-4 mr-2" />
                Gameplay
              </TabsTrigger>
              <TabsTrigger value="debug" className="data-[state=active]:bg-purple-600">
                <Bug className="w-4 h-4 mr-2" />
                Debug Tools
              </TabsTrigger>
              <TabsTrigger value="system" className="data-[state=active]:bg-purple-600">
                <Database className="w-4 h-4 mr-2" />
                System
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="characters" className="h-full overflow-y-auto">
                <AdminCharactersPanel />
              </TabsContent>

              <TabsContent value="gameplay" className="h-full overflow-y-auto">
                <AdminGameplayPanel />
              </TabsContent>

              <TabsContent value="debug" className="h-full overflow-y-auto">
                <AdminDebugPanel />
              </TabsContent>

              <TabsContent value="system" className="h-full overflow-y-auto">
                <AdminSystemPanel />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}