/**
 * QuickMenuButtons.tsx - Quick Access Menu Triggers (NEW SYSTEM!)
 * Last Edited: 2025-10-24 by Assistant - Replace old menu toggles with clean API
 */

import React from 'react';
import { useMenu, MENU_IDS } from './menu/MenuProvider';
import { useGameState } from '../context/GameContext';

/**
 * 🎯 QUICK MENU BUTTONS - CLEAN MENU ACCESS
 * 
 * Features:
 * - Simple click handlers that use the new menu system
 * - No more z-index conflicts
 * - No more state management chaos
 * - Just clean useMenu().open() calls!
 */
export function QuickMenuButtons() {
  const { open } = useMenu();
  const { user, effectiveStats } = useGameState();
  
  return (
    <div className="fixed top-4 right-4 flex flex-col space-y-2 z-30">
      {/* Upgrades Button */}
      <button
        onClick={() => open(MENU_IDS.UPGRADES)}
        className="
          px-4 py-2 bg-blue-600 hover:bg-blue-700 
          text-white rounded-lg shadow-lg 
          transition-colors duration-200
          flex items-center space-x-2
        "
      >
        <span>⬆️</span>
        <span>Upgrades</span>
      </button>
      
      {/* Passive Income Button */}
      <button
        onClick={() => open(MENU_IDS.PASSIVE)}
        className="
          px-4 py-2 bg-green-600 hover:bg-green-700 
          text-white rounded-lg shadow-lg 
          transition-colors duration-200
          flex items-center space-x-2
        "
      >
        <span>💰</span>
        <span>Passive</span>
      </button>
      
      {/* TODO: Add more menu buttons as needed */}
      {/*
      <button
        onClick={() => open(MENU_IDS.TASKS)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-colors"
      >
        <span>🎯</span>
        <span>Tasks</span>
      </button>
      
      <button
        onClick={() => open(MENU_IDS.CHARACTER)}
        className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg shadow-lg transition-colors"
      >
        <span>👩</span>
        <span>Character</span>
      </button>
      */}
      
      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 bg-gray-900/80 p-2 rounded">
          <div>LP: {user?.lp || 0}</div>
          <div>Tap: {effectiveStats?.lpPerTap || 2}</div>
          <div>Hour: {effectiveStats?.lpPerHour || 250}</div>
        </div>
      )}
    </div>
  );
}

/**
 * 🎯 BOTTOM MENU BAR (ALTERNATIVE LAYOUT)
 * For mobile-friendly bottom navigation
 */
export function BottomMenuBar() {
  const { open } = useMenu();
  
  const menuItems = [
    { id: MENU_IDS.UPGRADES, icon: '⬆️', label: 'Upgrades', color: 'blue' },
    { id: MENU_IDS.PASSIVE, icon: '💰', label: 'Passive', color: 'green' },
    { id: MENU_IDS.TASKS, icon: '🎯', label: 'Tasks', color: 'purple' },
    { id: MENU_IDS.CHARACTER, icon: '👩', label: 'Character', color: 'pink' },
    { id: MENU_IDS.SETTINGS, icon: '⚙️', label: 'Settings', color: 'gray' }
  ];
  
  return (
    <div className="
      fixed bottom-0 left-0 right-0 
      bg-gray-900/95 backdrop-blur-sm border-t border-gray-700
      px-2 py-2 z-20
    ">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {menuItems.map(item => {
          const colorClasses = {
            blue: 'text-blue-400 active:text-blue-300',
            green: 'text-green-400 active:text-green-300', 
            purple: 'text-purple-400 active:text-purple-300',
            pink: 'text-pink-400 active:text-pink-300',
            gray: 'text-gray-400 active:text-gray-300'
          };
          
          return (
            <button
              key={item.id}
              onClick={() => open(item.id)}
              className={`
                flex flex-col items-center space-y-1 p-2 rounded-lg
                transition-colors duration-200
                hover:bg-gray-800/50
                ${colorClasses[item.color as keyof typeof colorClasses]}
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 🎯 GAME UI BUTTONS
 * Replace your existing menu buttons with these
 */
export function GameUIButtons() {
  const { open } = useMenu();
  const { user, effectiveStats } = useGameState();
  
  return (
    <>
      {/* Top Stats Bar */}
      <div className="fixed top-4 left-4 right-4 z-20">
        <div className="flex justify-between items-center">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700">
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-yellow-400">
                💰 {user?.lp?.toLocaleString() || 0} LP
              </div>
              <div className="text-blue-400">
                ⚡ {effectiveStats?.lpPerTap || 2}/tap
              </div>
              <div className="text-green-400">
                🔄 {effectiveStats?.lpPerHour || 250}/hr
              </div>
            </div>
          </div>
          
          <button
            onClick={() => open(MENU_IDS.UPGRADES)}
            className="
              bg-blue-600 hover:bg-blue-700 
              text-white px-4 py-2 rounded-lg 
              font-medium transition-colors
            "
          >
            ⬆️ Upgrades
          </button>
        </div>
      </div>
      
      {/* Bottom Menu Bar */}
      <BottomMenuBar />
    </>
  );
}

export default QuickMenuButtons;