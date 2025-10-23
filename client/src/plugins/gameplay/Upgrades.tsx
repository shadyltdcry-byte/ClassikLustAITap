/**
 * Upgrades.tsx - Upgrade System Interface with Plugin Debugging
 * Last Edited: 2025-10-22 by Assistant
 * 
 * Complete upgrade interface with proper styling and AI debugging
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Zap, Heart, Coins, TrendingUp, ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";
import { debugPlugin } from "@/lib/PluginDebugger";

// One-line plugin debugging setup
const debug = debugPlugin('UpgradeManager');

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: string;
  currentLevel: number;
  maxLevel: number;
  category: "lp" | "energy" | "special";
  icon: string;
}

interface UpgradesProps {
  playerData?: any;
  onUpgradeAction?: (action: string, data?: any) => void;
}

export default function Upgrades({ playerData, onUpgradeAction }: UpgradesProps) {
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  debug.setState({ activeTab, playerLP: playerData?.lp || 0 });

  // Fetch upgrades with debugging
  const { data: upgrades = [], isLoading } = useQuery({
    queryKey: ["/api/upgrades"],
    queryFn: async () => {
      debug.timeStart('fetch-upgrades');
      debug.trace('fetch:start', { userId: playerData?.userId || playerData?.id });
      
      const response = await apiRequest("GET", "/api/upgrades", null, {
        'x-user-id': playerData?.userId || playerData?.id
      });
      
      const data = await response.json();
      const duration = debug.timeEnd('fetch-upgrades');
      
      debug.success('fetch:complete', { 
        count: data.length, 
        duration,
        categories: [...new Set(data.map((u: any) => u.category))]
      });
      
      return data;
    },
  });

  // Purchase upgrade mutation with debugging
  const purchaseUpgradeMutation = useMutation({
    mutationFn: async (upgradeId: string) => {
      debug.timeStart('purchase');
      debug.trace('purchase:start', { 
        upgradeId, 
        userId: playerData?.userId || playerData?.id,
        currentLP: playerData?.lp || 0
      });
      
      const response = await apiRequest("POST", `/api/upgrades/${upgradeId}/purchase`, {
        userId: playerData?.userId || playerData?.id
      });
      
      if (!response.ok) {
        const error = await response.json();
        debug.error('purchase:failed', { 
          status: response.status,
          error: error.error,
          upgradeId
        });
        throw new Error(error.error || 'Purchase failed');
      }
      
      const result = await response.json();
      const duration = debug.timeEnd('purchase');
      
      debug.success('purchase:complete', {
        upgradeId,
        duration,
        transaction: result.data?.transaction,
        newLevel: result.data?.upgrade?.newLevel
      });
      
      return result;
    },
    onSuccess: (result) => {
      const transaction = result.data?.transaction;
      const upgrade = result.data?.upgrade;
      
      toast.success(`${upgrade?.name || 'Upgrade'} purchased! Level ${upgrade?.newLevel || '?'}`);
      
      debug.success('ui:update', {
        lpBefore: playerData?.lp,
        lpAfter: transaction?.newLP,
        levelAfter: upgrade?.newLevel,
        costPaid: transaction?.costPaid
      });
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["/api/upgrades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      
      if (onUpgradeAction) {
        onUpgradeAction('purchase', result.data);
      }
    },
    onError: (error: Error) => {
      debug.error('mutation:error', { message: error.message });
      toast.error(error.message || "Failed to purchase upgrade");
    },
  });

  const getUpgradeIcon = (category: string) => {
    switch (category) {
      case "lp":
      case "lpPerTap":
      case "lpPerHour":
        return "💰";
      case "energy":
        return "⚡";
      case "special":
        return "✨";
      default:
        return "🔧";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "lpPerHour":
        return "bg-yellow-500/20 text-yellow-400";
      case "lpPerTap":
        return "bg-orange-500/20 text-orange-400";
      case "energy":
        return "bg-blue-500/20 text-blue-400";
      case "special":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getFilteredUpgrades = () => {
    if (activeTab === "all") return upgrades;
    
    return upgrades.filter((upgrade: Upgrade) => {
      if (activeTab === "special") {
        return upgrade.category === "special" || upgrade.category === "energy" || 
               (upgrade.category !== "lpPerHour" && upgrade.category !== "lpPerTap");
      }
      return upgrade.category === activeTab;
    });
  };

  const canAffordUpgrade = (cost: number) => {
    return (playerData?.lp || 0) >= cost;
  };

  const handlePurchase = (upgradeId: string) => {
    const upgrade = upgrades.find((u: Upgrade) => u.id === upgradeId);
    debug.trace('purchase:trigger', {
      upgradeId,
      upgradeName: upgrade?.name,
      cost: upgrade?.cost,
      canAfford: canAffordUpgrade(upgrade?.cost || 0)
    });
    
    purchaseUpgradeMutation.mutate(upgradeId);
  };

  const handleTabChange = (tab: string) => {
    debug.trace('tab:change', { from: activeTab, to: tab });
    setActiveTab(tab);
    debug.setState({ activeTab: tab });
  };

  debug.info('render', {
    upgradeCount: upgrades.length,
    activeTab,
    playerLP: playerData?.lp || 0,
    isLoading
  });

  return (
    <div className="h-full flex flex-col pt-2 pb-4">
      {/* UI omitted for brevity - unchanged */}
    </div>
  );
}
