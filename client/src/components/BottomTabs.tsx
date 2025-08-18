import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber, calculateUpgradeCost, calculateUpgradeEffect, canAffordUpgrade, getUserUpgradeLevel } from "@/lib/gameUtils";
import type { User, Upgrade, UserUpgrade } from "@shared/schema";

interface BottomTabsProps {
  user: User;
  upgrades: Upgrade[];
  userUpgrades: UserUpgrade[];
  onPurchaseUpgrade: (data: { upgradeId: string; level: number }) => void;
  upgradePending: boolean;
}

export function BottomTabs({ 
  user, 
  upgrades, 
  userUpgrades, 
  onPurchaseUpgrade, 
  upgradePending 
}: BottomTabsProps) {
  
  const renderUpgradeSection = (category: string, title: string, icon: string, color: string) => {
    const categoryUpgrades = upgrades.filter(upgrade => upgrade.category === category);
    
    return (
      <div className="space-y-3">
        <h3 className={`font-orbitron font-bold text-lg border-b pb-2 flex items-center ${color}`}>
          <i className={`${icon} mr-2`}></i>{title}
        </h3>
        
        {categoryUpgrades.map(upgrade => {
          const currentLevel = getUserUpgradeLevel(userUpgrades, upgrade.id);
          const nextLevel = currentLevel + 1;
          const cost = calculateUpgradeCost(upgrade.baseCost, currentLevel, upgrade.costMultiplier);
          const effect = calculateUpgradeEffect(upgrade.baseEffect, currentLevel, upgrade.effectMultiplier);
          const canAfford = canAffordUpgrade(user.lp, cost);
          const isMaxLevel = upgrade.maxLevel ? currentLevel >= upgrade.maxLevel : false;
          const isLocked = user.level < upgrade.levelRequirement;
          
          return (
            <Card 
              key={upgrade.id} 
              className={`glass-effect hover:bg-game-accent/5 transition-colors ${isLocked ? 'opacity-50' : ''}`}
              data-testid={`card-upgrade-${upgrade.id}`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white" data-testid={`text-upgrade-name-${upgrade.id}`}>
                      {upgrade.name}
                    </h4>
                    <span className={`text-sm ${color}`} data-testid={`text-upgrade-level-${upgrade.id}`}>
                      {isLocked ? "Locked" : `Level ${currentLevel}`}
                    </span>
                  </div>
                  <div className="text-right">
                    {!isLocked && !isMaxLevel && (
                      <>
                        <div className="text-game-gold font-bold" data-testid={`text-upgrade-effect-${upgrade.id}`}>
                          {category === 'lp_per_tap' ? `${effect}x` : `+${formatNumber(effect)}`} {
                            category === 'lp_per_hour' ? 'LP/h' :
                            category === 'energy' ? 'Energy' : 'LP'
                          }
                        </div>
                        <div className="text-sm text-gray-400" data-testid={`text-upgrade-cost-${upgrade.id}`}>
                          Cost: {formatNumber(cost)} LP
                        </div>
                      </>
                    )}
                    {isLocked && (
                      <div className="text-gray-400 text-sm">
                        Requires Level {upgrade.levelRequirement}
                      </div>
                    )}
                    {isMaxLevel && (
                      <Badge variant="outline" className="text-game-gold border-game-gold">
                        MAX LEVEL
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button 
                  className={`w-full font-semibold transition-colors ${
                    category === 'lp_per_hour' ? 'bg-game-accent hover:bg-game-cyan' :
                    category === 'energy' ? 'bg-game-amber hover:bg-game-gold text-game-bg' :
                    'bg-game-gold hover:bg-game-amber text-game-bg'
                  }`}
                  disabled={!canAfford || upgradePending || isMaxLevel || isLocked}
                  onClick={() => onPurchaseUpgrade({ upgradeId: upgrade.id, level: nextLevel })}
                  data-testid={`button-upgrade-${upgrade.id}`}
                >
                  {isLocked ? "Locked" : 
                   isMaxLevel ? "Max Level" :
                   !canAfford ? "Insufficient LP" :
                   upgradePending ? "Upgrading..." : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-80 glass-effect border-t border-game-accent/20" data-testid="bottom-tabs">
      <Tabs defaultValue="upgrades" className="h-full">
        <TabsList className="h-12 w-full bg-transparent border-b border-game-accent/10 rounded-none">
          <TabsTrigger 
            value="upgrades" 
            className="flex-1 font-orbitron font-semibold data-[state=active]:text-game-gold data-[state=active]:bg-game-accent/10 data-[state=active]:border-b-2 data-[state=active]:border-game-gold"
            data-testid="tab-upgrades"
          >
            <i className="fas fa-arrow-up mr-2"></i>
            Upgrades
          </TabsTrigger>
          <TabsTrigger 
            value="levelup" 
            className="flex-1 font-orbitron font-semibold data-[state=active]:text-game-gold data-[state=active]:bg-game-accent/10"
            data-testid="tab-levelup"
          >
            <i className="fas fa-star mr-2"></i>
            Level Up
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="flex-1 font-orbitron font-semibold data-[state=active]:text-game-gold data-[state=active]:bg-game-accent/10"
            data-testid="tab-tasks"
          >
            <i className="fas fa-tasks mr-2"></i>
            Tasks
          </TabsTrigger>
          <TabsTrigger 
            value="achievements" 
            className="flex-1 font-orbitron font-semibold data-[state=active]:text-game-gold data-[state=active]:bg-game-accent/10"
            data-testid="tab-achievements"
          >
            <i className="fas fa-trophy mr-2"></i>
            Achievements
          </TabsTrigger>
          <TabsTrigger 
            value="shop" 
            className="flex-1 font-orbitron font-semibold data-[state=active]:text-game-gold data-[state=active]:bg-game-accent/10"
            data-testid="tab-shop"
          >
            <i className="fas fa-shopping-cart mr-2"></i>
            Shop
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upgrades" className="h-68 p-4 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderUpgradeSection("lp_per_hour", "LP per Hour", "fas fa-clock", "text-game-cyan border-game-cyan/30")}
            {renderUpgradeSection("energy", "Increased Energy", "fas fa-bolt", "text-game-amber border-game-amber/30")}
            {renderUpgradeSection("lp_per_tap", "LP per Tap", "fas fa-hand-pointer", "text-game-gold border-game-gold/30")}
          </div>
        </TabsContent>
        
        <TabsContent value="levelup" className="h-68 p-4 overflow-y-auto">
          <div className="text-center">
            <h3 className="font-orbitron text-xl font-bold text-game-gold mb-4">Level Progress</h3>
            <p className="text-gray-300">Current Level: {user.level}</p>
            <p className="text-sm text-gray-400 mt-2">Level up system coming soon!</p>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="h-68 p-4 overflow-y-auto">
          <div className="text-center">
            <h3 className="font-orbitron text-xl font-bold text-game-cyan mb-4">Daily Tasks</h3>
            <p className="text-sm text-gray-400">Task system coming soon!</p>
          </div>
        </TabsContent>
        
        <TabsContent value="achievements" className="h-68 p-4 overflow-y-auto">
          <div className="text-center">
            <h3 className="font-orbitron text-xl font-bold text-game-gold mb-4">Achievements</h3>
            <p className="text-sm text-gray-400">Achievement system coming soon!</p>
          </div>
        </TabsContent>
        
        <TabsContent value="shop" className="h-68 p-4 overflow-y-auto">
          <div className="text-center">
            <h3 className="font-orbitron text-xl font-bold text-game-amber mb-4">Shop</h3>
            <p className="text-sm text-gray-400">Shop system coming soon!</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
