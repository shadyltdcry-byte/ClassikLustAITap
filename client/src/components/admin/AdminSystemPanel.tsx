import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Settings, RefreshCw, Trash2 } from "lucide-react";
import FileManagerCore from "@/plugins/core/FileManagerCore";
import MediaFileCleanup from "@/components/admin/MediaFileCleanup";

export default function AdminSystemPanel() {
  const [showFileManager, setShowFileManager] = useState(false);
  const [showMediaFileCleanup, setShowMediaFileCleanup] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">System Management</h2>
        <p className="text-gray-400">System administration and maintenance tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* File Manager */}
        <Card className="bg-gray-800 border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => setShowFileManager(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              File Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Manage system files and media uploads</p>
          </CardContent>
        </Card>

        {/* Media File Cleanup */}
        <Card className="bg-gray-800 border-gray-700 hover:border-red-500/50 transition-colors cursor-pointer"
              onClick={() => setShowMediaFileCleanup(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Media Cleanup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Clean up unused media files and optimize storage</p>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="bg-gray-800 border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-400" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Configure system-wide settings and preferences</p>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-gray-800 border-gray-700 hover:border-yellow-500/50 transition-colors cursor-pointer">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-yellow-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Monitor system health and performance metrics</p>
          </CardContent>
        </Card>
      </div>

      {/* File Manager Modal */}
      {showFileManager && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">File Manager</h3>
              <Button variant="ghost" onClick={() => setShowFileManager(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <FileManagerCore />
            </div>
          </div>
        </div>
      )}

      {/* Media File Cleanup Modal */}
      {showMediaFileCleanup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Media File Cleanup</h3>
              <Button variant="ghost" onClick={() => setShowMediaFileCleanup(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <MediaFileCleanup />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}