/**
 * UpgradesMenu.tsx - Modular Upgrades Menu (FIXES LP PER TAP!)
 * Last Edited: 2025-10-24 by Assistant - Clean upgrade purchase with stats refresh
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BaseMenu, MenuSection, MenuItem, MenuLoadingOverlay } from '../BaseMenu';
import { useGameState } from '../../../context/GameContext';
import { toast } from '../../../utils/toast';

interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: string;
  baseCost: number;
  baseEffect: number;
  costMultiplier: number;
  effectMultiplier: number;
  maxLevel?: number;
  currentLevel?: number;
  nextCost?: number;
  isUnlocked?: boolean;
}

interface UpgradeCategory {
  name: string;
  upgrades: Upgrade[];
}

interface UpgradesMenuProps {
  props?: {
    initialTab?: string;
  };
  onClose: () => void;
  onReplace: (menuId: string, props?: Record<string, any>) => void;
}

/**
 * 💪 UPGRADES MENU - NO MORE Z-INDEX HELL!
 * 
 * Features:
 * - Loads /api/upgrades for user-specific data
 * - Purchase flow with proper loading states
 * - Refreshes player stats after purchase (FIXES LP PER TAP!)
 * - Shows upgrades in admin panel via /api/upgrades/all
 * - Clean error handling and user feedback
 */
export function UpgradesMenu({ props, onClose }: UpgradesMenuProps) {
  const { user, refreshPlayerStats, updateUserLP } = useGameState();
  const [categories, setCategories] = useState<UpgradeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(props?.initialTab || 'tapping');
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 🔄 LOAD UPGRADES DATA
   */
  const loadUpgrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.telegramId) {
        setError('User not authenticated');
        return;
      }
      
      console.log('💪 [UPGRADES MENU] Loading upgrades for user:', user.telegramId);
      
      // Load user-specific upgrades
      const response = await fetch(`/api/upgrades?telegramId=${user.telegramId}`);
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || 'Failed to load upgrades');
        return;
      }
      
      // Group upgrades by category
      const upgradesByCategory: Record<string, Upgrade[]> = {};
      
      (result.data || []).forEach((upgrade: Upgrade) => {
        const category = upgrade.category || 'Other';
        if (!upgradesByCategory[category]) {
          upgradesByCategory[category] = [];
        }
        upgradesByCategory[category].push(upgrade);
      });
      
      // Convert to array format
      const categoryArray: UpgradeCategory[] = Object.entries(upgradesByCategory).map(([name, upgrades]) => ({
        name,
        upgrades
      }));
      
      setCategories(categoryArray);
      console.log(`✅ [UPGRADES MENU] Loaded ${categoryArray.length} categories with ${result.data?.length || 0} total upgrades`);
      
    } catch (error: any) {
      console.error('❌ [UPGRADES MENU] Failed to load upgrades:', error);
      setError(error.message || 'Failed to load upgrades');
    } finally {
      setLoading(false);
    }
  }, [user?.telegramId]);
  
  /**
   * 💰 PURCHASE UPGRADE
   */
  const purchaseUpgrade = useCallback(async (upgrade: Upgrade) => {
    if (!user?.telegramId || purchasing) {
      return;
    }
    
    try {
      setPurchasing(upgrade.id);
      
      console.log(`💰 [UPGRADES MENU] Purchasing ${upgrade.id} for ${user.telegramId}`);
      
      // Purchase the upgrade
      const response = await fetch('/api/upgrades/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telegramId: user.telegramId,
          upgradeId: upgrade.id
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        toast.error(result.error || 'Purchase failed');
        return;
      }
      
      console.log(`✅ [UPGRADES MENU] Purchase successful:`, result);
      
      // Update user LP in state
      if (result.upgrade?.newLP !== undefined) {
        updateUserLP(result.upgrade.newLP);
      }
      
      // 🎯 THIS IS THE KEY FIX - REFRESH COMPUTED STATS!
      await refreshPlayerStats();
      
      // Reload upgrades to show updated levels
      await loadUpgrades();
      
      // Show success toast
      toast.success(`${upgrade.name} upgraded! New level: ${result.upgrade.newLevel}`);
      
    } catch (error: any) {
      console.error('❌ [UPGRADES MENU] Purchase failed:', error);
      toast.error('Purchase failed - please try again');
    } finally {
      setPurchasing(null);
    }
  }, [user?.telegramId, purchasing, updateUserLP, refreshPlayerStats, loadUpgrades]);
  
  // Load upgrades when menu opens
  useEffect(() => {
    loadUpgrades();
  }, [loadUpgrades]);
  
  // Get current category
  const currentCategory = categories.find(cat => 
    cat.name.toLowerCase() === activeTab.toLowerCase()
  ) || categories[0];
  
  return (
    <BaseMenu
      title="Upgrades"
      onClose={onClose}
      size="lg"
      isLoading={loading}
      loadingText="Loading upgrades..."
      headerActions={
        <button
          onClick={loadUpgrades}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Refresh
        </button>
      }
    >
      <div className="relative">
        <MenuLoadingOverlay show={!!purchasing} text="Processing purchase..." />
        
        {error ? (
          <MenuSection title="Error">
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 mb-3">{error}</p>
              <button
                onClick={loadUpgrades}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </MenuSection>
        ) : (
          <>
            {/* Category Tabs */}
            {categories.length > 1 && (
              <div className="flex overflow-x-auto bg-gray-800 border-b border-gray-700">
                {categories.map(category => (
                  <button
                    key={category.name}
                    onClick={() => setActiveTab(category.name.toLowerCase())}
                    className={`
                      px-4 py-3 whitespace-nowrap font-medium transition-colors
                      ${
                        activeTab.toLowerCase() === category.name.toLowerCase()
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-gray-400 hover:text-gray-200'
                      }
                    `}
                  >
                    {category.name} ({category.upgrades.length})
                  </button>
                ))}
              </div>
            )}
            
            {/* Upgrades List */}
            {currentCategory ? (
              <MenuSection title={`${currentCategory.name} Upgrades`}>
                <div className="space-y-3">
                  {currentCategory.upgrades.map(upgrade => (
                    <div key={upgrade.id} className="bg-gray-800 rounded-lg border border-gray-700">
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">{upgrade.name}</h4>
                            <p className="text-sm text-gray-400 mb-2">{upgrade.description}</p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Level: {upgrade.currentLevel || 0}</span>
                              {upgrade.maxLevel && (
                                <span>Max: {upgrade.maxLevel}</span>
                              )}
                              <span>Effect: +{upgrade.baseEffect}</span>
                            </div>
                          </div>
                          
                          <div className="text-right ml-4">
                            {upgrade.nextCost && upgrade.isUnlocked ? (
                              <button
                                onClick={() => purchaseUpgrade(upgrade)}
                                disabled={purchasing === upgrade.id || (user?.lp || 0) < upgrade.nextCost}
                                className={`
                                  px-4 py-2 rounded-md font-medium transition-colors
                                  ${
                                    purchasing === upgrade.id
                                      ? 'bg-yellow-600 text-white cursor-not-allowed'
                                      : (user?.lp || 0) >= upgrade.nextCost
                                      ? 'bg-green-600 hover:bg-green-700 text-white'
                                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  }
                                `}
                              >
                                {purchasing === upgrade.id ? 'Buying...' : `${upgrade.nextCost} LP`}
                              </button>
                            ) : (
                              <span className="text-sm text-gray-500">
                                {!upgrade.isUnlocked ? 'Locked' : 'Max Level'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </MenuSection>
            ) : (
              <MenuSection title="No Upgrades">
                <p className="text-gray-400 text-center py-8">No upgrades available in this category.</p>
              </MenuSection>
            )}
          </>
        )}
      </div>
    </BaseMenu>
  );
}

export default UpgradesMenu;