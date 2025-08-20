/**
 * Upgrades Plugin - Manage character and gameplay upgrades
 * Last Modified: 2025-08-20 by Assistant
 * Features: Purchase upgrades to enhance tap power, passive generation, and energy capacity
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  bonus: number;
  currentLevel: number;
  maxLevel: number;
  type: 'lpPerHour' | 'energy' | 'lpPerTap';
}

interface GameStats {
  lustPoints: number;
  lpPerHour: number;
  lpPerTap: number;
  currentEnergy: number;
  maxEnergy: number;
}

export default function Upgrade() {
  const [activeTab, setActiveTab] = useState<"lpPerHour" | "energy" | "lpPerTap">("lpPerHour");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gameStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/game-stats"],
    enabled: true,
  });

  const { data: upgrades, isLoading: isLoadingUpgrades } = useQuery({
    queryKey: ["/api/upgrades"],
    enabled: true,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (upgradeId: string) => {
      const response = await apiRequest("POST", `/api/upgrades/${upgradeId}/purchase`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upgrades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-stats"] });
      toast({
        title: "Upgrade Purchased",
        description: "Your upgrade has been successfully purchased.",
      });
    },
  });

  const handlePurchase = (upgradeType: string, level: number) => {
    const upgradeId = `${upgradeType}-${level}`;
    purchaseMutation.mutate(upgradeId);
  };

  const canAfford = (cost: number) => {
    return gameStats?.lustPoints !== undefined && gameStats.lustPoints >= cost;
  };

  if (isLoadingUpgrades || isLoadingStats) {
    return <div className="text-white p-4">Loading upgrades...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "lpPerHour" | "energy" | "lpPerTap")}>
        <TabsList className="mb-4 bg-gray-800">
          <TabsTrigger value="lpPerHour" className="px-4 py-2 data-[state=active]:bg-blue-600">
            LP per Hour
          </TabsTrigger>
          <TabsTrigger value="energy" className="px-4 py-2 data-[state=active]:bg-purple-600">
            Energy Upgrade
          </TabsTrigger>
          <TabsTrigger value="lpPerTap" className="px-4 py-2 data-[state=active]:bg-red-600">
            LP per Tap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lpPerHour">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">LP per Hour Upgrades</h2>
            <p className="text-gray-400 mb-4">Increase your passive LP generation rate</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map((level) => {
                const cost = level * 100;
                const bonus = level * 10;
                return (
                  <Card key={level} className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">LP/Hour Level {level}</CardTitle>
                      <CardDescription className="text-gray-400">Increase LP generation by {bonus}/hour</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-gray-300">Cost: <span className="text-yellow-400 font-bold">{cost} LP</span></p>
                        <p className="text-gray-300">Bonus: <span className="text-blue-400 font-bold">+{bonus}/hour</span></p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handlePurchase("lpPerHour", level)}
                        disabled={purchaseMutation.isPending || !canAfford(cost)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {purchaseMutation.isPending ? "Purchasing..." : "Purchase"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="energy">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Energy Upgrades</h2>
            <p className="text-gray-400 mb-4">Increase your maximum energy and regeneration</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map((level) => {
                const cost = level * 150;
                const bonus = level * 20;
                return (
                  <Card key={level} className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Energy Level {level}</CardTitle>
                      <CardDescription className="text-gray-400">Increase max energy by {bonus}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-gray-300">Cost: <span className="text-yellow-400 font-bold">{cost} LP</span></p>
                        <p className="text-gray-300">Bonus: <span className="text-red-400 font-bold">+{bonus} energy</span></p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handlePurchase("energy", level)}
                        disabled={purchaseMutation.isPending || !canAfford(cost)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {purchaseMutation.isPending ? "Purchasing..." : "Purchase"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="lpPerTap">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">LP per Tap Upgrades</h2>
            <p className="text-gray-400 mb-4">Increase LP gained from each character tap</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map((level) => {
                const cost = level * 200;
                const bonus = level * 2;
                return (
                  <Card key={level} className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Tap Power Level {level}</CardTitle>
                      <CardDescription className="text-gray-400">Increase LP per tap by {bonus}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-gray-300">Cost: <span className="text-yellow-400 font-bold">{cost} LP</span></p>
                        <p className="text-gray-300">Bonus: <span className="text-green-400 font-bold">+{bonus} LP/tap</span></p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handlePurchase("lpPerTap", level)}
                        disabled={purchaseMutation.isPending || !canAfford(cost)}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        {purchaseMutation.isPending ? "Purchasing..." : "Purchase"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}