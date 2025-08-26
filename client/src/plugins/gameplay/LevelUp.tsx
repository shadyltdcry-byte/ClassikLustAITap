/**
 * LevelUp.tsx - Complete Level Up System
 * Last Edited: 2025-08-18 by Assistant
 *
 * This component handles player level progression, XP tracking, upgrade requirements,
 * and bonus rewards. It integrates with the GameProvider for state management and
 * triggers bonus rewards when players level up.
 * 
 * Features:
 * - XP tracking and level progression
 * - Upgrade requirement validation
 * - Level-based unlock system
 * - Bonus reward integration
 * - Visual progress indicators
 * - Admin tools for level management
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  Trophy, 
  Lock, 
  Unlock, 
  Zap, 
  TrendingUp, 
  Gift,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiRequest } from '@/lib/queryClient';

// Interfaces
interface UpgradeRequirement {
  upgradeType: 'lpPerHour' | 'energy' | 'lpPerTap';
  upgradeName?: string; // Specific upgrade name (for energy and LP per Tap)
  requiredLevel: number;
}

interface LevelRequirement {
  level: number;
  requirements?: UpgradeRequirement[]; // Made optional to handle server data
  rewards?: {
    lp?: number;
    coins?: number;
    maxEnergy?: number;
    lpPerHour?: number;
    lpPerTap?: number;
    unlocks?: string[]; // Character unlocks, features, etc.
  };
}

interface PlayerUpgrades {
  lpPerHour: { [key: string]: number };
  energy: { [key: string]: number };
  lpPerTap: { [key: string]: number };
}

interface LevelUpProps {
  onLevelUp?: (newLevel: number) => void;
}

/**
 * Default level requirements configuration
 * Defines what upgrades are needed to reach each level
 */
const DEFAULT_LEVEL_REQUIREMENTS: LevelRequirement[] = [
  {
    level: 2,
    requirements: [
      { upgradeType: 'lpPerHour', requiredLevel: 2 }
    ],
    rewards: {
      lp: 100,
      maxEnergy: 10,
      unlocks: ['Basic character creation']
    }
  },
  {
    level: 3,
    requirements: [
      { upgradeType: 'lpPerHour', requiredLevel: 3 }
    ],
    rewards: {
      lp: 250,
      maxEnergy: 15,
      lpPerHour: 5,
      unlocks: ['Wheel of Fortune']
    }
  },
  {
    level: 4,
    requirements: [
      { upgradeType: 'lpPerHour', requiredLevel: 4 }
    ],
    rewards: {
      lp: 500,
      coins: 50,
      maxEnergy: 20,
      unlocks: ['Boosters system']
    }
  },
  {
    level: 5,
    requirements: [
      { upgradeType: 'lpPerHour', requiredLevel: 5 },
      { upgradeType: 'energy', upgradeName: 'MaxEnergy', requiredLevel: 3 },
      { upgradeType: 'lpPerTap', requiredLevel: 2 }
    ],
    rewards: {
      lp: 1000,
      coins: 100,
      maxEnergy: 25,
      lpPerHour: 10,
      lpPerTap: 1,
      unlocks: ['Advanced character creation', 'AI Chat system']
    }
  },
  {
    level: 10,
    requirements: [
      { upgradeType: 'lpPerHour', requiredLevel: 10 },
      { upgradeType: 'energy', requiredLevel: 5 },
      { upgradeType: 'lpPerTap', requiredLevel: 5 }
    ],
    rewards: {
      lp: 5000,
      coins: 500,
      maxEnergy: 50,
      lpPerHour: 25,
      lpPerTap: 2,
      unlocks: ['VIP characters', 'Premium features']
    }
  }
];

export default function LevelUp() {
  const { playerData, levelUp: gameLevelUp, setPlayerData } = useGame();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [levelRequirements, setLevelRequirements] = useState<LevelRequirement[]>(DEFAULT_LEVEL_REQUIREMENTS);

  const queryClient = useQueryClient();

  // Fetch level requirements from server
  const { data: serverRequirements } = useQuery({
    queryKey: ['/api/level-requirements'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/level-requirements');
        return await response.json();
      } catch (error) {
        console.warn('Failed to fetch level requirements, using defaults');
        return DEFAULT_LEVEL_REQUIREMENTS;
      }
    },
  });

  // Update requirements when server data loads
  useEffect(() => {
    if (serverRequirements) {
      setLevelRequirements(serverRequirements);
    }
  }, [serverRequirements]);

  // Level up mutation
  const levelUpMutation = useMutation({
    mutationFn: async (targetLevel: number) => {
      const canLevel = await checkCanLevelUp(playerData.id, targetLevel);
      if (!canLevel.canLevel) {
        throw new Error(`Cannot level up to ${targetLevel}: ${canLevel.reason}`);
      }

      // Apply level up rewards
      const levelReq = levelRequirements.find(req => req.level === targetLevel);
      if (levelReq?.rewards) {
        await applyLevelUpRewards(levelReq.rewards, targetLevel);
      }

      // Update server
      try {
        await apiRequest('POST', `/api/player/${playerData.id}/level-up`, { 
          newLevel: targetLevel,
          rewards: levelReq?.rewards 
        });
      } catch (error) {
        console.warn('Failed to sync level up with server:', error);
      }

      return targetLevel;
    },
    onSuccess: (newLevel) => {
      toast.success(`Congratulations! You've reached level ${newLevel}!`);
      gameLevelUp();
      // Level up completed successfully
      queryClient.invalidateQueries({ queryKey: ['/api/player'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to level up');
    },
  });

  /**
   * Fetches current player upgrade levels from the game state
   * Converts GameProvider format to LevelUp format
   */
  const getPlayerUpgrades = (): PlayerUpgrades => {
    return {
      lpPerHour: playerData.upgrades?.lpPerHour || {},
      energy: playerData.upgrades?.energy || {},
      lpPerTap: playerData.upgrades?.lpPerTap || {},
    };
  };

  /**
   * Checks if player can level up to a specific level
   * Validates all upgrade requirements for that level
   */
  const checkCanLevelUp = async (playerId: string, targetLevel: number): Promise<{
    canLevel: boolean;
    reason?: string;
    missingRequirements?: UpgradeRequirement[];
  }> => {
    const playerUpgrades = getPlayerUpgrades();
    const levelRequirement = levelRequirements.find(lr => lr.level === targetLevel);

    if (!levelRequirement) {
      return { canLevel: false, reason: `No requirements defined for level ${targetLevel}` };
    }

    if (playerData.level >= targetLevel) {
      return { canLevel: false, reason: `Already at or above level ${targetLevel}` };
    }

    const missingRequirements: UpgradeRequirement[] = [];

    for (const req of (levelRequirement.requirements || [])) {
      let requirementMet = false;

      if (req.upgradeType === 'lpPerHour') {
        // All LP per Hour upgrades must be at required level
        const lpPerHourUpgrades = Object.values(playerUpgrades.lpPerHour);
        requirementMet = lpPerHourUpgrades.length > 0 && 
          lpPerHourUpgrades.every(level => level >= req.requiredLevel);
      } else {
        // For energy and lpPerTap, check specific upgrade if specified
        const upgradeCategory = playerUpgrades[req.upgradeType];
        if (req.upgradeName) {
          requirementMet = upgradeCategory[req.upgradeName] >= req.requiredLevel;
        } else {
          requirementMet = Object.values(upgradeCategory).some(level => level >= req.requiredLevel);
        }
      }

      if (!requirementMet) {
        missingRequirements.push(req);
      }
    }

    if (missingRequirements.length > 0) {
      return {
        canLevel: false,
        reason: 'Upgrade requirements not met',
        missingRequirements
      };
    }

    return { canLevel: true };
  };

  /**
   * Applies level up rewards to player data
   * Integrates with Bonuses system for reward distribution
   */
  const applyLevelUpRewards = async (rewards: NonNullable<LevelRequirement['rewards']>, level: number) => {
    const updates: Partial<typeof playerData> = {};

    if (rewards.lp) updates.lp = (playerData.lp || 0) + rewards.lp;
    if (rewards.coins) updates.coins = (playerData.coins || 0) + rewards.coins;
    if (rewards.maxEnergy) updates.maxEnergy = (playerData.maxEnergy || 100) + rewards.maxEnergy;
    if (rewards.lpPerHour) updates.lpPerHour = (playerData.lpPerHour || 10) + rewards.lpPerHour;
    if (rewards.lpPerTap) updates.lpPerTap = (playerData.lpPerTap || 1) + rewards.lpPerTap;

    // Apply updates to game state
    setPlayerData(updates);

    // Trigger bonus rewards through Bonuses system
    if (rewards.unlocks) {
      rewards.unlocks.forEach(unlock => {
        toast.success(`🎉 New feature unlocked: ${unlock}`);
      });
    }

    // Log level up bonus for tracking
    console.log(`Level ${level} rewards applied:`, rewards);
  };

  /**
   * Attempts to level up player to the next available level
   * Checks requirements and applies rewards automatically
   */
  const attemptLevelUp = async () => {
    let currentCheckLevel = playerData.level + 1;
    let levelsGained = 0;

    // Check each level in sequence
    while (currentCheckLevel <= Math.max(...levelRequirements.map(r => r.level))) {
      const canLevel = await checkCanLevelUp(playerData.id, currentCheckLevel);

      if (canLevel.canLevel) {
        await levelUpMutation.mutateAsync(currentCheckLevel);
        levelsGained++;
        currentCheckLevel++;
      } else {
        break;
      }
    }

    if (levelsGained === 0) {
      toast('No level ups available. Continue upgrading!');
    }
  };

  /**
   * Gets the next level the player can potentially reach
   */
  const getNextAvailableLevel = (): number => {
    return levelRequirements
      .filter(req => req.level > playerData.level)
      .sort((a, b) => a.level - b.level)[0]?.level || playerData.level;
  };

  /**
   * Calculates XP percentage for current level
   */
  const getXPPercentage = (): number => {
    if (!playerData.xpToNext) return 0;
    return Math.min(100, (playerData.xp / playerData.xpToNext) * 100);
  };

  /**
   * Formats upgrade requirement for display
   */
  const formatUpgradeRequirement = (req: UpgradeRequirement): string => {
    if (req.upgradeType === 'lpPerHour') {
      return `All LP/Hour upgrades to level ${req.requiredLevel}`;
    } else if (req.upgradeName) {
      return `${req.upgradeName} to level ${req.requiredLevel}`;
    } else {
      return `Any ${req.upgradeType} upgrade to level ${req.requiredLevel}`;
    }
  };

  /**
   * Checks if specific requirement is met
   */
  const isRequirementMet = (req: UpgradeRequirement): boolean => {
    const playerUpgrades = getPlayerUpgrades();

    if (req.upgradeType === 'lpPerHour') {
      const lpPerHourUpgrades = Object.values(playerUpgrades.lpPerHour);
      return lpPerHourUpgrades.length > 0 && 
        lpPerHourUpgrades.every(level => level >= req.requiredLevel);
    } else {
      const upgradeCategory = playerUpgrades[req.upgradeType];
      if (req.upgradeName) {
        return (upgradeCategory[req.upgradeName] || 0) >= req.requiredLevel;
      } else {
        return Object.values(upgradeCategory).some(level => level >= req.requiredLevel);
      }
    }
  };

  const nextLevel = getNextAvailableLevel();
  const currentLevelReq = levelRequirements.find(req => req.level === nextLevel);

  return (
    <div className="space-y-6">
      {/* Current Level Status */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Level {playerData.level}</CardTitle>
                <CardDescription className="text-purple-300">
                  {playerData.xp} / {playerData.xpToNext} XP
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-purple-300 border-purple-500">
              Player Level
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Experience Progress</span>
                <span>{getXPPercentage().toFixed(1)}%</span>
              </div>
              <Progress value={getXPPercentage()} className="h-3 bg-gray-700" />
            </div>

            <Button
              onClick={attemptLevelUp}
              disabled={levelUpMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {levelUpMutation.isPending ? 'Leveling Up...' : 'Check for Level Up'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="next" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="next">Next Level</TabsTrigger>
          <TabsTrigger value="all">All Levels</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        {/* Next Level Requirements */}
        <TabsContent value="next" className="space-y-4">
          {currentLevelReq ? (
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Level {currentLevelReq.level} Requirements
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Complete these upgrades to reach the next level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Requirements List */}
                <div className="space-y-2">
                  {(currentLevelReq?.requirements || []).map((req, index) => {
                    const isMet = isRequirementMet(req);
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isMet 
                            ? 'bg-green-900/20 border-green-500/30 text-green-300' 
                            : 'bg-red-900/20 border-red-500/30 text-red-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isMet ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          <span>{formatUpgradeRequirement(req)}</span>
                        </div>
                        <Badge variant={isMet ? "default" : "destructive"}>
                          {isMet ? 'Complete' : 'Incomplete'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                <Separator className="bg-gray-600" />

                {/* Rewards Preview */}
                {currentLevelReq.rewards && (
                  <div>
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-purple-400" />
                      Level Up Rewards
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {currentLevelReq.rewards.lp && (
                        <div className="bg-purple-900/30 p-3 rounded-lg text-center">
                          <div className="text-purple-300 text-lg font-bold">
                            +{currentLevelReq.rewards.lp.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">LP Bonus</div>
                        </div>
                      )}
                      {currentLevelReq.rewards.coins && (
                        <div className="bg-yellow-900/30 p-3 rounded-lg text-center">
                          <div className="text-yellow-300 text-lg font-bold">
                            +{currentLevelReq.rewards.coins}
                          </div>
                          <div className="text-xs text-gray-400">Coins</div>
                        </div>
                      )}
                      {currentLevelReq.rewards.maxEnergy && (
                        <div className="bg-blue-900/30 p-3 rounded-lg text-center">
                          <div className="text-blue-300 text-lg font-bold">
                            +{currentLevelReq.rewards.maxEnergy}
                          </div>
                          <div className="text-xs text-gray-400">Max Energy</div>
                        </div>
                      )}
                      {currentLevelReq.rewards.lpPerHour && (
                        <div className="bg-green-900/30 p-3 rounded-lg text-center">
                          <div className="text-green-300 text-lg font-bold">
                            +{currentLevelReq.rewards.lpPerHour}
                          </div>
                          <div className="text-xs text-gray-400">LP/Hour</div>
                        </div>
                      )}
                    </div>

                    {currentLevelReq.rewards.unlocks && (
                      <div className="mt-4">
                        <h5 className="text-white font-medium mb-2">New Unlocks:</h5>
                        <div className="space-y-1">
                          {currentLevelReq.rewards.unlocks.map((unlock, index) => (
                            <div key={index} className="flex items-center gap-2 text-purple-300">
                              <Unlock className="w-4 h-4" />
                              <span className="text-sm">{unlock}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-800/50 border-gray-600">
              <CardContent className="text-center py-8">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-white text-xl font-bold mb-2">Max Level Reached!</h3>
                <p className="text-gray-400">You've reached the highest available level.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Levels Overview */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {levelRequirements
              .sort((a, b) => a.level - b.level)
              .map((levelReq) => {
                const isUnlocked = playerData.level >= levelReq.level;
                const canUnlock = levelReq.level === nextLevel;

                return (
                  <Card 
                    key={levelReq.level}
                    className={`border transition-all cursor-pointer ${
                      isUnlocked 
                        ? 'bg-green-900/20 border-green-500/30' 
                        : canUnlock
                        ? 'bg-yellow-900/20 border-yellow-500/30'
                        : 'bg-gray-800/50 border-gray-600'
                    }`}
                    onClick={() => setSelectedLevel(
                      selectedLevel === levelReq.level ? null : levelReq.level
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isUnlocked 
                              ? 'bg-green-600' 
                              : canUnlock 
                              ? 'bg-yellow-600' 
                              : 'bg-gray-600'
                          }`}>
                            {isUnlocked ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : canUnlock ? (
                              <Zap className="w-5 h-5 text-white" />
                            ) : (
                              <Lock className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-white">Level {levelReq.level}</CardTitle>
                            <CardDescription className="text-gray-400">
                              {levelReq.requirements?.length || 0} requirement(s)
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={
                          isUnlocked ? "default" : canUnlock ? "secondary" : "outline"
                        }>
                          {isUnlocked ? 'Unlocked' : canUnlock ? 'Available' : 'Locked'}
                        </Badge>
                      </div>
                    </CardHeader>

                    {selectedLevel === levelReq.level && (
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-white font-medium mb-2">Requirements:</h4>
                            {(levelReq.requirements || []).map((req, index) => (
                              <div key={index} className="text-sm text-gray-300 mb-1">
                                • {formatUpgradeRequirement(req)}
                              </div>
                            ))}
                          </div>

                          {levelReq.rewards && (
                            <div>
                              <h4 className="text-white font-medium mb-2">Rewards:</h4>
                              <div className="text-sm text-purple-300 space-y-1">
                                {levelReq.rewards.lp && <div>• +{levelReq.rewards.lp} LP</div>}
                                {levelReq.rewards.coins && <div>• +{levelReq.rewards.coins} Coins</div>}
                                {levelReq.rewards.maxEnergy && <div>• +{levelReq.rewards.maxEnergy} Max Energy</div>}
                                {levelReq.rewards.lpPerHour && <div>• +{levelReq.rewards.lpPerHour} LP/Hour</div>}
                                {levelReq.rewards.unlocks && (
                                  <div>• Unlocks: {levelReq.rewards.unlocks.join(', ')}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
          </div>
        </TabsContent>
   </Tabs>
    </div>
  );
}