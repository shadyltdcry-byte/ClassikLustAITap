                /**
                 * AdminMenu.tsx
                 * Last Edited: 2025-08-18 by Steven
                 *
                 * Floating admin menu UI for managing game features:
                 * - Character Creation
                 * - Character Editor
                 * - Inventory / Shop
                 * - File Manager
                 * - AI Chat
                 * - Daily Rewards
                 * - Misc (Boosters, Tasks, Achievements)
                 *
                 * All sections are scrollable and self-contained.
                 * Interactive calls are stubbed for later hooking.
                 */

                import { useState } from "react";
                import { Button } from "@/components/ui/button";
                import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
                import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

                export default function AdminMenu() {
                  const [activeTab, setActiveTab] = useState("characters");
                  const [isOpen, setIsOpen] = useState(true);

                  if (!isOpen) return null;

                  return (
                    <div className="fixed top-10 right-10 w-96 h-[80vh] bg-gray-900/90 border border-gray-700 rounded-xl shadow-lg p-4 z-50">
                      {/* Header */}
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

                      {/* Tabs */}
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                        <TabsList className="grid grid-cols-3 mb-2 gap-1">
                          <TabsTrigger value="characters">Characters</TabsTrigger>
                          <TabsTrigger value="gamemgmt">Game</TabsTrigger>
                          <TabsTrigger value="filemgmt">Files</TabsTrigger>
                          <TabsTrigger value="aichat">AI Chat</TabsTrigger>
                          <TabsTrigger value="misc">Misc</TabsTrigger>
                        </TabsList>

                        {/* Characters Tab */}
                        <TabsContent value="characters" className="overflow-auto flex-1 space-y-4">
                          <Card className="bg-gray-800/50 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-white">Character Creation</CardTitle>
                              <CardDescription className="text-gray-400">
                                Create new characters for the game.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="max-h-48 overflow-auto">
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

                        {/* Game Manager Tab */}
                        <TabsContent value="gamemgmt" className="overflow-auto flex-1 space-y-4">
                          <Card className="bg-gray-800/50 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-white">Inventory / Shop</CardTitle>
                              <CardDescription className="text-gray-400">
                                Manage items, customization, and player inventory.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="max-h-48 overflow-auto">
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
                              {/** <DailyRewards /> */}
                            </CardContent>
                          </Card>
                        </TabsContent>

                        {/* File Manager Tab */}
                        <TabsContent value="filemgmt" className="overflow-auto flex-1 space-y-4">
                          <Card className="bg-gray-800/50 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-white">File Manager</CardTitle>
                              <CardDescription className="text-gray-400">
                                Manage JSON files and game data storage.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="max-h-48 overflow-auto">
                              {/** <FileManager /> */}
                            </CardContent>
                          </Card>
                        </TabsContent>

                        {/* AI Chat Tab */}
                        <TabsContent value="aichat" className="overflow-auto flex-1 space-y-4">
                          <Card className="bg-gray-800/50 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-white">AI Chat</CardTitle>
                              <CardDescription className="text-gray-400">
                                Debug and test AI conversations.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="max-h-48 overflow-auto">
                              {/** <AIChat /> */}
                            </CardContent>
                          </Card>
                        </TabsContent>

                        {/* Misc Tab */}
                        <TabsContent value="misc" className="overflow-auto flex-1 space-y-4">
                          <Card className="bg-gray-800/50 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-white">Boosters & Constants</CardTitle>
                              <CardDescription className="text-gray-400">
                                Manage LP, Energy, Boosters, and other constants.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="max-h-48 overflow-auto">
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
                              {/** <Tasks /> */}
                              {/** <Achievements /> */}
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </div>
                  );
                }