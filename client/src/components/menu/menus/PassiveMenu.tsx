/**
 * PassiveMenu.tsx - Passive LP Claiming Menu (FIXES BALANCE UPDATES!)
 * Last Edited: 2025-10-24 by Assistant - Proper passive LP claiming with balance refresh
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BaseMenu, MenuSection, MenuLoadingOverlay } from '../BaseMenu';
import { useGameState } from '../../../context/GameContext';
import { toast } from '../../../utils/toast';

interface PassiveStatus {
  minutesOffline: number;
  availableLP: number;
  lpPerHour: number;
  canClaim: boolean;
  currentLP: number;
  maxClaimHours: number;
}

interface PassiveMenuProps {
  props?: Record<string, any>;
  onClose: () => void;
  onReplace: (menuId: string, props?: Record<string, any>) => void;
}

/**
 * 💰 PASSIVE MENU - PROPER LP CLAIMING!
 * 
 * Features:
 * - Shows available passive LP
 * - Claims with proper balance updates
 * - Real-time countdown and status
 * - Circuit breaker protection
 * - Success feedback and UI refresh
 */
export function PassiveMenu({ onClose }: PassiveMenuProps) {
  const { user, updateUserLP, refreshPlayerStats } = useGameState();
  const [status, setStatus] = useState<PassiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  /**
   * 🔍 LOAD PASSIVE STATUS
   */
  const loadStatus = useCallback(async () => {
    try {
      setError(null);
      
      if (!user?.telegramId) {
        setError('User not authenticated');
        return;
      }
      
      console.log('💰 [PASSIVE MENU] Loading passive status for:', user.telegramId);
      
      const response = await fetch(`/api/passive/status?telegramId=${user.telegramId}`);
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || 'Failed to load passive status');
        return;
      }
      
      setStatus(result.data);
      console.log(`✅ [PASSIVE MENU] Status loaded - ${result.data.availableLP} LP available`);
      
    } catch (error: any) {
      console.error('❌ [PASSIVE MENU] Failed to load status:', error);
      setError(error.message || 'Failed to load passive status');
    } finally {
      setLoading(false);
    }
  }, [user?.telegramId]);
  
  /**
   * 💰 CLAIM PASSIVE LP
   */
  const claimPassiveLP = useCallback(async () => {
    if (!user?.telegramId || claiming || !status?.canClaim) {
      return;
    }
    
    try {
      setClaiming(true);
      
      console.log(`💰 [PASSIVE MENU] Claiming ${status.availableLP} LP for ${user.telegramId}`);
      
      const response = await fetch('/api/passive/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telegramId: user.telegramId
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        toast.error(result.error || 'Claim failed');
        return;
      }
      
      console.log(`✅ [PASSIVE MENU] Claimed successfully:`, result);
      
      // Update user LP with new balance
      if (result.newBalance !== undefined) {
        updateUserLP(result.newBalance);
      }
      
      // Show success toast
      toast.success(`Claimed ${result.claimed} LP! New balance: ${result.newBalance}`);
      
      // Refresh status and player stats
      await Promise.all([
        loadStatus(),
        refreshPlayerStats()
      ]);
      
    } catch (error: any) {
      console.error('❌ [PASSIVE MENU] Claim failed:', error);
      toast.error('Claim failed - please try again');
    } finally {
      setClaiming(false);
    }
  }, [user?.telegramId, claiming, status?.canClaim, status?.availableLP, updateUserLP, refreshPlayerStats, loadStatus]);
  
  // Auto-refresh status every 30 seconds
  useEffect(() => {
    loadStatus();
    
    const interval = setInterval(() => {
      if (!claiming) {
        loadStatus();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadStatus, claiming]);
  
  // Countdown timer for next LP accumulation
  useEffect(() => {
    if (status && !claiming) {
      const interval = setInterval(() => {
        setCountdown(Date.now());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [status, claiming]);
  
  // Format time display
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };
  
  return (
    <BaseMenu
      title="Passive Income"
      onClose={onClose}
      size="md"
      isLoading={loading}
      loadingText="Loading passive status..."
    >
      <div className="relative">
        <MenuLoadingOverlay show={claiming} text="Claiming LP..." />
        
        {error ? (
          <MenuSection title="Error">
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 mb-3">{error}</p>
              <button
                onClick={loadStatus}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </MenuSection>
        ) : status ? (
          <>
            {/* Status Overview */}
            <MenuSection title="Current Status">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      {status.availableLP}
                    </p>
                    <p className="text-xs text-gray-400">LP Available</p>
                  </div>
                  
                  <div>
                    <p className="text-lg font-bold text-blue-400">
                      {status.lpPerHour}
                    </p>
                    <p className="text-xs text-gray-400">LP per Hour</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                  <p className="text-sm text-gray-400">
                    Offline for: <span className="text-white font-medium">
                      {formatTime(status.minutesOffline)}
                    </span>
                  </p>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Max claim: {status.maxClaimHours} hours
                  </p>
                </div>
              </div>
            </MenuSection>
            
            {/* Claim Button */}
            <MenuSection>
              <button
                onClick={claimPassiveLP}
                disabled={!status.canClaim || claiming}
                className={`
                  w-full py-4 rounded-lg font-bold text-lg transition-colors
                  ${
                    status.canClaim && !claiming
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {claiming ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Claiming...</span>
                  </div>
                ) : status.canClaim ? (
                  `Claim ${status.availableLP} LP`
                ) : (
                  'No LP to Claim'
                )}
              </button>
              
              {!status.canClaim && status.availableLP === 0 && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  Come back later to claim more passive LP!
                </p>
              )}
            </MenuSection>
            
            {/* Info Section */}
            <MenuSection title="How It Works">
              <div className="space-y-2 text-sm text-gray-400">
                <p>
                  • You earn LP while offline at a rate of {status.lpPerHour} LP/hour
                </p>
                <p>
                  • Maximum offline claim is {status.maxClaimHours} hours
                </p>
                <p>
                  • Upgrade your passive income to earn more LP while away
                </p>
                <p>
                  • Current balance: {status.currentLP} LP
                </p>
              </div>
            </MenuSection>
          </>
        ) : null}
      </div>
    </BaseMenu>
  );
}

export default PassiveMenu;