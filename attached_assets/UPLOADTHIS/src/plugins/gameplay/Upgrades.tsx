/**
 * Upgrades.tsx
 * Last Edited: 2025-08-17 by Steven
 *
 *
 *
 * Please leave a detailed description
 *      of each function you add
 */



import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  bonus: number;
  maxLevel: number;
  currentLevel: number;
}

interface GameStats {
  lustPoints: number;
  tapPower: number;
  maxEnergy: number;
  currentEnergy: number;
}

export default function Upgrade() {
  const [activeTab, setActiveTab] = useState<"purchase" | "create" | "manage">("purchase");
  const [newUpgrade, setNewUpgrade] = useState({
    name: "",
    description: "",
    cost: 0,
    bonus: 0,
    maxLevel: 1,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: upgrades, isLoading: isLoadingUpgrades } = useQuery<Upgrade[]>({
    queryKey: ["/api/upgrades"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/upgrades");
      return await response.json();
    },
    enabled: true,
  });

  const { data: gameStats } = useQuery<GameStats>({
    queryKey: ["/api/gamestats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/gamestats");
      return await response.json();
    },
    enabled: true,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (upgradeId: string) => {
      const response = await apiRequest("POST", `/api/upgrades/purchase/${upgradeId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upgrades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamestats"] });
      toast({
        title: "Upgrade Purchased",
        description: "Your upgrade has been successfully purchased.",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newUpgradeData: Omit<Upgrade, 'id' | 'currentLevel'>) => {
      const response = await apiRequest("POST", "/api/upgrades", newUpgradeData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upgrades"] });
      toast({
        title: "Upgrade Created",
        description: "Your new upgrade has been successfully created.",
      });
      setNewUpgrade({
        name: "",
        description: "",
        cost: 0,
        bonus: 0,
        maxLevel: 1,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (upgradeId: string) => {
      const response = await apiRequest("DELETE", `/api/upgrades/${upgradeId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upgrades"] });
      toast({
        title: "Upgrade Deleted",
        description: "Your upgrade has been successfully deleted.",
      });
    },
  });

  const handlePurchase = (upgradeId: string) => {
    purchaseMutation.mutate(upgradeId);
  };

  const handleCreate = () => {
    createMutation.mutate({
      ...newUpgrade,
    });
  };

  const handleDelete = (upgradeId: string) => {
    deleteMutation.mutate(upgradeId);
  };

  const calculateCost = (baseCost: number, currentLevel: number) => {
    return baseCost * (currentLevel + 1);
  };

  const canAfford = (cost: number) => {
    return gameStats?.lustPoints !== undefined && gameStats.lustPoints >= cost;
  };

  const isMaxLevel = (upgrade: Upgrade) => {
    return upgrade.currentLevel >= upgrade.maxLevel;
  };

  if (isLoadingUpgrades) {
    return <div>Loading upgrades...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "purchase" | "create" | "manage")}>
        <TabsList className="mb-4">
          <TabsTrigger value="purchase" className="px-4 py-2">
            Purchase
          </TabsTrigger>
          <TabsTrigger value="create" className="px-4 py-2">
            Create
          </TabsTrigger>
          <TabsTrigger value="manage" className="px-4 py-2">
            Manage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchase">
          <div className="flex flex-col gap-4">
            {upgrades?.map((upgrade) => (
              <Card key={upgrade.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>{upgrade.name}</CardTitle>
                  <CardDescription>{upgrade.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Cost: {calculateCost(upgrade.cost, upgrade.currentLevel)} Lust Points</p>
                  <p>Bonus: +{upgrade.bonus} per tap</p>
                  <p>Level: {upgrade.currentLevel}/{upgrade.maxLevel}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    onClick={() => handlePurchase(upgrade.id)}
                    disabled={!canAfford(calculateCost(upgrade.cost, upgrade.currentLevel)) || isMaxLevel(upgrade)}
                    className={`bg-blue-600 hover:bg-blue-700 ${(!canAfford(calculateCost(upgrade.cost, upgrade.currentLevel)) || isMaxLevel(upgrade)) && "opacity-50 cursor-not-allowed"}`}
                  >
                    {isMaxLevel(upgrade) ? "Max Level" : "Purchase"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={newUpgrade.name} onChange={(e) => setNewUpgrade({...newUpgrade, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={newUpgrade.description} onChange={(e) => setNewUpgrade({...newUpgrade, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Base Cost</Label>
              <Input id="cost" type="number" value={newUpgrade.cost} onChange={(e) => setNewUpgrade({...newUpgrade, cost: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus">Bonus</Label>
              <Input id="bonus" type="number" value={newUpgrade.bonus} onChange={(e) => setNewUpgrade({...newUpgrade, bonus: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLevel">Max Level</Label>
              <Input id="maxLevel" type="number" value={newUpgrade.maxLevel} onChange={(e) => setNewUpgrade({...newUpgrade, maxLevel: parseInt(e.target.value)})} />
            </div>
            <Button onClick={handleCreate} className="w-full bg-green-600 hover:bg-green-700">
              Create Upgrade
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="manage">
          <div className="flex flex-col gap-4">
            {upgrades?.map((upgrade) => (
              <Card key={upgrade.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>{upgrade.name}</CardTitle>
                  <CardDescription>{upgrade.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Cost: {upgrade.cost}</p>
                  <p>Bonus: {upgrade.bonus}</p>
                  <p>Max Level: {upgrade.maxLevel}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button onClick={() => handleDelete(upgrade.id)} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
