/** 
 * AdminMenu.tsx
 * Last Edited: 2025-08-18 by Steven
 *
 * Floating admin menu UI for managing game features:
 * - Character Creation
 * - Character Editor
 * - File Manager
 * - AI Chat
 * - Inventory / Shop
 * - Daily Rewards
 *
 * Sections are scrollable and uniform.
 * All interactive calls are stubbed with /** hook your function here */
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminMenu() {
  const [activeTab, setActiveTab] = useState("characters");
  const [isOpen, setIsOpen] = useState(true); // toggle visibility of the floating menu

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-10 right-10 w-96 h-[80vh] bg-gray-900/90 border border-gray-700 rounded-xl shadow-lg p-4 z-50"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-xl font-bold">Admin Menu</h2>
        <Button
          variant="outline"
          className="text-white border-gray-600 hover:bg-gray-700"
          onClick={() => setIsOpen(false)}
        >
          Close
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <TabsList className="grid grid-cols-3 mb-2">
          <TabsTrigger value="characters">Characters Manager</TabsTrigger>
          <TabsTrigger value="gamemgmt">Game Manager</TabsTrigger>
           <TabsTrigger value="filemgmt">File Manager</TabsTrigger>
           <TabsTrigger value="aichat">AI Chat</TabsTrigger>
          <TabsTrigger value="misc">Misc</TabsTrigger>
        </TabsList>

          <ScrollArea className="flex-1 overflow-auto">
            {/* Characters Section */}
            <TabsContent value="characters" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Character Creation</CardTitle>
                  <CardDescription className="text-gray-400">
                    Create new characters for the game.
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-48 overflow-auto">
                  {/* Nested scroll area for long content */}
                  {/** <CharacterCreation /> */}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Character Editor</CardTitle>
                  <CardDescription className="text-gray-400">
                    Edit existing characters and customize traits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-48 overflow-auto">
                  {/** <CharacterEditor /> */}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Repeat the same nested scrolling for other sections like Inventory, AIChat, DailyRewards, etc. */}
          </ScrollArea>

          <ScrollArea className="flex-1 overflow-auto">
          {/* Game Manager Section */}
          <TabsContent value="gamemgmt" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Game Manager</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage JSON files and data storage.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-48 overflow-auto">
                {/* Hook your FileManager component here */}
                {/** <FileManager /> */}
              </CardContent>
            </Card>

            <ScrollArea className="flex-1 overflow-auto">
            {/*AIChat */}
            <TabsContent value="aichat" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">AI Chat</CardTitle>
                <CardDescription className="text-gray-400">
                  Debug and test AI conversations.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="max-h-48 overflow-auto">
                {/* Hook your AIChat component here */}
                {/** <AIChat /> */}
              </CardContent>
            </Card>

              <ScrollArea className="flex-1 overflow-auto">
          {/* Game Manager Section */}
          <TabsContent value="gamemgmt" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Inventory / Shop</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage items, customization, and player inventory.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-48 overflow-auto">
                {/* Hook your Inventory / Shop component here */}
                {/** <Inventory /> */}
                {/** <Shop /> */}
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Daily Rewards</CardTitle>
                <CardDescription className="text-gray-400">
                  Grant daily rewards to players.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-48 overflow-auto">
                {/* Hook your DailyRewards component here */}
                {/** <DailyRewards /> */}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Misc Section */}
          <TabsContent value="misc" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Boosters & Constants</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage LP, Energy, Boosters, and other constants.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-48 overflow-auto">
                {/* Hook your constants/booster management component here */}
                {/** <BoostersManager /> */}
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Tasks & Achievements</CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor tasks, achievements, and level ups.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-48 overflow-auto">
                {/* Hook your Task / Achievement component here */}
                {/** <Tasks /> */}
                {/** <Achievements /> */}
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}