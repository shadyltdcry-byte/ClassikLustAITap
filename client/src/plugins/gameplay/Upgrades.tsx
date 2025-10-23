/**
 * Upgrades.tsx - Upgrade System Interface with Dynamic Calculations & Better Icons
 * Last Edited: 2025-10-23 by Assistant
 * 
 * Complete upgrade interface with dynamic cost scaling, level display, and visual flair
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Zap, Heart, Coins, TrendingUp, ShoppingCart, Timer, Target, Sparkles, Battery } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";
import { debugPlugin } from "@/lib/PluginDebugger";

// One-line plugin debugging setup
const debug = debugPlugin('UpgradeManager');

interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;  // Base cost for level 1
  hourlyBonus?: number;
  tapBonus?: number;
  currentLevel: number;
  maxLevel: number;
  category: "lp" | "energy" | "special" | "lpPerTap" | "lpPerHour";
  icon: string;
}

interface UpgradesProps {
  playerData?: any;
  onUpgradeAction?: (action: string, data?: any) => void;
}

// DYNAMIC COST CALCULATION FUNCTIONS
const calculateUpgradeCost = (baseCost: number, currentLevel: number): number => {
  // Cost scaling: baseCost * (1.5 ^ currentLevel)
  return Math.floor(baseCost * Math.pow(1.5, currentLevel));
};

const calculateCurrentBonus = (baseBonus: number, currentLevel: number): number => {
  // Bonus scaling: baseBonus * currentLevel
  return baseBonus * currentLevel;
};

const getUpgradeEffect = (upgrade: Upgrade): string => {
  const currentBonus = upgrade.hourlyBonus 
    ? calculateCurrentBonus(upgrade.hourlyBonus, upgrade.currentLevel)
    : upgrade.tapBonus 
    ? calculateCurrentBonus(upgrade.tapBonus, upgrade.currentLevel)
    : 0;
    
  const nextBonus = upgrade.hourlyBonus 
    ? calculateCurrentBonus(upgrade.hourlyBonus, upgrade.currentLevel + 1)
    : upgrade.tapBonus 
    ? calculateCurrentBonus(upgrade.tapBonus, upgrade.currentLevel + 1)
    : 0;

  if (upgrade.category === 'lpPerHour') {
    return `+${upgrade.hourlyBonus || 10} LP/hour (Currently: +${currentBonus} LP/hour)`;
  }
  if (upgrade.category === 'lpPerTap') {
    return `+${upgrade.tapBonus || 1} LP/tap (Currently: +${currentBonus} LP/tap)`;
  }
  return upgrade.description || 'Unknown effect';
};

// BETTER UPGRADE ICONS WITH VISUAL FLAIR
const getUpgradeIcon = (category: string, upgradeName: string = "") => {
  // Use Lucide React icons for better visual consistency
  switch (category) {
    case "lpPerHour":
    case "lp":
      return <Timer className="w-8 h-8 text-yellow-400" />;
    case "lpPerTap":
      return <Target className="w-8 h-8 text-orange-400" />;
    case "energy":
      return <Battery className="w-8 h-8 text-blue-400" />;
    case "special":
      return <Sparkles className="w-8 h-8 text-purple-400" />;
    default:
      return <Star className="w-8 h-8 text-gray-400" />;
  }
};

export default function Upgrades({ playerData, onUpgradeAction }: UpgradesProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  debug.setState({ activeTab, playerLP: playerData?.lp || 0 });

  // Fetch upgrades with debugging and error handling
  const { data: upgrades = [], isLoading, error } = useQuery({
    queryKey: ["/api/upgrades"],
    queryFn: async () => {
      debug.timeStart('fetch-upgrades');
      const userId = playerData?.userId || playerData?.id;
      debug.trace('fetch:start', { userId, hasPlayerData: !!playerData });
      
      try {
        const response = await apiRequest("GET", "/api/upgrades", null, {
          'x-user-id': userId || 'anonymous'
        });
        
        if (!response.ok) {
          debug.error('fetch:failed', { status: response.status, url: '/api/upgrades' });
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const duration = debug.timeEnd('fetch-upgrades');
        
        debug.success('fetch:complete', { 
          count: data.length, 
          duration,
          categories: [...new Set(data.map((u: any) => u.category))]
        });
        
        setFetchError(null);
        return data;
      } catch (err: any) {
        const duration = debug.timeEnd('fetch-upgrades');
        debug.error('fetch:error', { message: err.message, duration });
        setFetchError(err.message);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "lpPerHour":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "lpPerTap":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "energy":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "special":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getFilteredUpgrades = () => {
    if (activeTab === "all") return upgrades;
    
    return upgrades.filter((upgrade: Upgrade) => {
      // More flexible category matching
      if (activeTab === "lpPerHour") return upgrade.category === "lpPerHour";
      if (activeTab === "lpPerTap") return upgrade.category === "lpPerTap";
      if (activeTab === "special") return upgrade.category === "special" || upgrade.category === "energy";
      return upgrade.category === activeTab;
    });
  };

  const canAffordUpgrade = (upgrade: Upgrade) => {
    const dynamicCost = calculateUpgradeCost(upgrade.baseCost, upgrade.currentLevel);
    return (playerData?.lp || 0) >= dynamicCost && upgrade.currentLevel < upgrade.maxLevel;
  };

  const handlePurchase = (upgradeId: string) => {
    const upgrade = upgrades.find((u: Upgrade) => u.id === upgradeId);
    const dynamicCost = upgrade ? calculateUpgradeCost(upgrade.baseCost, upgrade.currentLevel) : 0;
    
    debug.trace('purchase:trigger', {
      upgradeId,
      upgradeName: upgrade?.name,
      baseCost: upgrade?.baseCost,
      dynamicCost,
      currentLevel: upgrade?.currentLevel,
      canAfford: canAffordUpgrade(upgrade!)
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
    isLoading,
    hasError: !!error || !!fetchError
  });

  // Show error state if fetch failed
  if (error || fetchError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Upgrades</h3>
        <p className="text-gray-400 text-center mb-4">
          {fetchError || (error as Error)?.message || 'Unknown error'}
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/upgrades"] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-2 pb-4">
      {/* Header */}
      <div className="p-4 bg-black/30 border-b border-purple-500/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Upgrades</h3>
            <p className="text-sm text-gray-400">Enhance your character's abilities</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-pink-400 font-bold">{(playerData?.lp || 0).toLocaleString()} LP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Tabs */}
      <div className="p-3 bg-black/20 flex-shrink-0">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          <div className="flex gap-1 min-w-max">
            <Button 
              onClick={() => handleTabChange("all")}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap min-w-0 flex items-center gap-1 ${
                activeTab === "all" ? "bg-purple-600 hover:bg-purple-700 text-white" : 
                "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"
              }`}
            >
              <Star className="w-3 h-3" />
              All
            </Button>
            <Button 
              onClick={() => handleTabChange("lpPerHour")}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap min-w-0 flex items-center gap-1 ${
                activeTab === "lpPerHour" ? "bg-purple-600 hover:bg-purple-700 text-white" : 
                "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"
              }`}
            >
              <Timer className="w-3 h-3" />
              LP/Hour
            </Button>
            <Button 
              onClick={() => handleTabChange("lpPerTap")}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap min-w-0 flex items-center gap-1 ${
                activeTab === "lpPerTap" ? "bg-purple-600 hover:bg-purple-700 text-white" : 
                "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"
              }`}
            >
              <Target className="w-3 h-3" />
              LP/Tap
            </Button>
            <Button 
              onClick={() => handleTabChange("special")}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap min-w-0 flex items-center gap-1 ${
                activeTab === "special" ? "bg-purple-600 hover:bg-purple-700 text-white" : 
                "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-600/20"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Special
            </Button>
          </div>
        </div>
      </div>

      {/* Upgrade List */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {getFilteredUpgrades().map((upgrade: Upgrade) => {
                const dynamicCost = calculateUpgradeCost(upgrade.baseCost, upgrade.currentLevel);
                const currentBonus = upgrade.hourlyBonus 
                  ? calculateCurrentBonus(upgrade.hourlyBonus, upgrade.currentLevel)
                  : upgrade.tapBonus 
                  ? calculateCurrentBonus(upgrade.tapBonus, upgrade.currentLevel)
                  : 0;
                const isMaxLevel = upgrade.currentLevel >= upgrade.maxLevel;
                const canAfford = canAffordUpgrade(upgrade);
                
                return (
                  <div
                    key={upgrade.id}
                    className={`bg-gray-800/50 rounded-xl p-4 border transition-all duration-200 hover:bg-gray-700/50 ${
                      canAfford && !isMaxLevel 
                        ? "border-purple-500/50 hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20" 
                        : "border-gray-600/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* ENHANCED UPGRADE ICON */}
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        getCategoryColor(upgrade.category).split(' ')[0]
                      }`}>
                        {getUpgradeIcon(upgrade.category, upgrade.name)}
                      </div>

                      {/* Upgrade Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-semibold">{upgrade.name}</h4>
                          <Badge className={`${getCategoryColor(upgrade.category)} border`}>
                            {upgrade.category === 'lpPerHour' ? 'LP/HOUR' :
                             upgrade.category === 'lpPerTap' ? 'LP/TAP' :
                             upgrade.category.toUpperCase()}
                          </Badge>
                          {/* ENHANCED LEVEL DISPLAY */}
                          <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30">
                            Level {upgrade.currentLevel}/{upgrade.maxLevel}
                          </Badge>
                          {isMaxLevel && (
                            <Badge className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse">
                              🏆 MAX
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-2">{upgrade.description}</p>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">
                              {getUpgradeEffect(upgrade)}
                            </span>
                          </div>
                        </div>

                        {/* ENHANCED COST & PURCHASE SECTION */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-400" />
                            <span className={`font-bold ${
                              isMaxLevel ? "text-gray-500" : 
                              canAfford ? "text-pink-400" : "text-red-400"
                            }`}>
                              {isMaxLevel ? "MAX LEVEL" : `${dynamicCost.toLocaleString()} LP`}
                            </span>
                            {!isMaxLevel && upgrade.currentLevel > 0 && (
                              <span className="text-xs text-gray-500">
                                (was {calculateUpgradeCost(upgrade.baseCost, upgrade.currentLevel - 1).toLocaleString()})
                              </span>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => handlePurchase(upgrade.id)}
                            disabled={!canAfford || purchaseUpgradeMutation.isPending || isMaxLevel}
                            className={`px-6 py-2 rounded-full transition-all duration-200 ${
                              isMaxLevel
                                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                : canAfford
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/25"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {purchaseUpgradeMutation.isPending ? "Purchasing..." : 
                             isMaxLevel ? "Maxed" : "Purchase"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {!isLoading && getFilteredUpgrades().length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {upgrades.length === 0 
                      ? "No upgrades available. Check admin panel to create upgrades."
                      : "No upgrades available in this category"
                    }
                  </p>
                  {upgrades.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Debug: {fetchError ? `Error: ${fetchError}` : `Fetched ${upgrades.length} upgrades`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}