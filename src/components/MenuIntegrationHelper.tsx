/**
 * MenuIntegrationHelper.tsx - Gradual Migration Helper
 * Last Edited: 2025-10-24 by Assistant - Easy way to test new menu system alongside old
 */

import React, { useEffect } from 'react';
import { useMenu, MENU_IDS } from './menu/MenuProvider';
import { useGameState } from '../context/GameContext';

/**
 * 🔄 MENU INTEGRATION HELPER
 * Drop this component anywhere to add new menu buttons for testing!
 * 
 * This lets you test the new menu system without breaking existing UI
 */
export function MenuIntegrationHelper() {
  const { open, close, isOpen } = useMenu();
  const { user, effectiveStats, refreshPlayerStats } = useGameState();
  
  // Auto-refresh stats on mount to show correct LP per tap
  useEffect(() => {
    if (user?.telegramId) {
      console.log('🔄 [INTEGRATION] Auto-refreshing stats on mount');
      refreshPlayerStats();
    }
  }, [user?.telegramId, refreshPlayerStats]);
  
  return (
    <div className="fixed bottom-20 right-4 z-30 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-gray-600">
      <div className="text-xs text-gray-300 mb-2 font-bold">NEW MENU SYSTEM 🎆</div>
      
      {/* Stats Display */}
      <div className="text-xs text-gray-400 mb-3 space-y-1">
        <div>💰 LP: {user?.lp?.toLocaleString() || 0}</div>
        <div>⚡ Tap: {effectiveStats?.lpPerTap || 2}</div>
        <div>🔄 Hour: {effectiveStats?.lpPerHour || 250}</div>
      </div>
      
      {/* New Menu Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => open(MENU_IDS.UPGRADES)}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          ⬆️ NEW Upgrades
        </button>
        
        <button
          onClick={() => open(MENU_IDS.PASSIVE)}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
        >
          💰 NEW Passive
        </button>
        
        <button
          onClick={refreshPlayerStats}
          className="w-full px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
        >
          🔄 Refresh Stats
        </button>
        
        {isOpen() && (
          <button
            onClick={close}
            className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
          >
            ❌ Close Menu
          </button>
        )}
      </div>
      
      {/* Status Indicators */}
      <div className="mt-2 text-xs text-gray-500">
        {isOpen() ? `🟢 Menu Open` : `🟡 No Menu`}
      </div>
    </div>
  );
}

/**
 * 🧩 DEBUGGING OVERLAY
 * Shows API endpoint status and responses
 */
export function APIDebugOverlay() {
  const { user } = useGameState();
  const [apiStatus, setApiStatus] = React.useState<Record<string, any>>({});
  const [lastTest, setLastTest] = React.useState<string>('');
  
  const testEndpoint = async (name: string, url: string, method = 'GET', body?: any) => {
    try {
      console.log(`🧩 [DEBUG] Testing ${name}: ${method} ${url}`);
      
      const options: RequestInit = { method };
      if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, options);
      const result = await response.json();
      
      setApiStatus(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          success: result.success !== false,
          data: result,
          timestamp: new Date().toLocaleString()
        }
      }));
      
      setLastTest(`${name}: ${response.status}`);
      console.log(`✅ [DEBUG] ${name} responded:`, result);
    } catch (error: any) {
      setApiStatus(prev => ({
        ...prev,
        [name]: {
          status: 'ERROR',
          success: false,
          error: error.message,
          timestamp: new Date().toLocaleString()
        }
      }));
      
      setLastTest(`${name}: ERROR`);
      console.error(`❌ [DEBUG] ${name} failed:`, error);
    }
  };
  
  return (
    <div className="fixed top-4 left-4 z-30 bg-black/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600 max-w-xs">
      <div className="text-xs text-gray-300 mb-2 font-bold">API DEBUG 🧩</div>
      
      <div className="space-y-1 mb-3">
        <button
          onClick={() => testEndpoint('Health', '/health')}
          className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
        >
          Test Health
        </button>
        
        <button
          onClick={() => testEndpoint('Stats', `/api/player/${user?.telegramId}/stats`)}
          disabled={!user?.telegramId}
          className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded"
        >
          Test Stats
        </button>
        
        <button
          onClick={() => testEndpoint('Claim', '/api/passive/claim', 'POST', { telegramId: user?.telegramId })}
          disabled={!user?.telegramId}
          className="w-full px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-xs rounded"
        >
          Test Claim
        </button>
      </div>
      
      <div className="text-xs text-gray-500">
        Last: {lastTest || 'None'}
      </div>
      
      <div className="mt-2 max-h-24 overflow-y-auto text-xs">
        {Object.entries(apiStatus).map(([name, status]) => (
          <div key={name} className={`p-1 rounded mb-1 ${
            status.success ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
          }`}>
            {name}: {status.status} {status.success ? '✅' : '❌'}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuIntegrationHelper;