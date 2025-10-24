/**
 * PlayerStatsPanel.tsx - Game Stats with NEW MENU SYSTEM INTEGRATION!
 * Last Edited: 2025-10-24 by Assistant - FIXED: Menu imports now use @ alias!
 */

import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Zap, Heart, Gem, TrendingUp, Sparkles, ArrowUp, DollarSign } from "lucide-react";

// Import the new menu system components - FIXED: Now uses @ alias!
import { MenuProvider, useMenu, MENU_IDS } from "@/components/menu/MenuProvider";
import { MenuHost } from "@/components/menu/MenuHost";
import { initializeMenuRegistry } from "@/components/menu/MenuRegistry";
import { toast } from "react-hot-toast";

interface PlayerStatsPanelProps {
  user?: any;
  playerData?: any;
  selectedCharacter?: any;
  onAvatarClick: () => void;
  onOpenGallery: () => void;
}

/**
 * 🎯 NEW MENU INTEGRATION BUTTONS
 * These replace the old modal system!
 */
function NewMenuButtons() {
  const { open, isOpen, close } = useMenu();
  const [stats, setStats] = useState<any>(null);
  
  // Auto-refresh stats to show correct LP per tap
  useEffect(() => {
    const refreshStats = async () => {
      try {
        const response = await fetch('/api/player/5134006535/stats');
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to refresh stats:', error);
      }
    };
    
    refreshStats();
    const interval = setInterval(refreshStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Stats Display */}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-purple-500/50">
        <div className="text-purple-300 text-xs font-bold mb-2">LIVE STATS 📊</div>
        <div className="text-white text-xs space-y-1">
          <div>💰 LP: {stats?.baseStats?.lp?.toLocaleString() || '...'}</div>
          <div>⚡ Tap: {stats?.effectiveStats?.lpPerTap || '...'}</div>
          <div>🔄 Hour: {stats?.effectiveStats?.lpPerHour || '...'}</div>
        </div>
      </div>
      
      {/* Menu Control Buttons */}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-purple-500/50 space-y-2">
        <div className="text-purple-300 text-xs font-bold mb-2">NEW MENUS 🎆</div>
        
        <button
          onClick={() => {
            console.log('🎯 Opening NEW Upgrades menu');
            open(MENU_IDS.UPGRADES);
          }}
          className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-bold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
        >
          ⬆️ NEW Upgrades
        </button>
        
        <button
          onClick={() => {
            console.log('🎯 Opening NEW Passive menu');
            open(MENU_IDS.PASSIVE);
          }}
          className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-bold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
        >
          💰 NEW Passive
        </button>
        
        {isOpen() && (
          <button
            onClick={() => {
              console.log('🎯 Closing menu');
              close();
            }}
            className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-all duration-300"
          >
            ❌ Close
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 🎮 ENHANCED PLAYER STATS PANEL WITH NEW MENU SYSTEM
 */
function PlayerStatsPanelCore({
  user,
  playerData,
  selectedCharacter,
  onAvatarClick,
  onOpenGallery
}: PlayerStatsPanelProps) {
  return (
    <div className="flex justify-between items-center p-2 bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-red-900/40 border-b-2 border-gradient-to-r from-pink-500/50 via-purple-500/50 to-red-500/50 flex-shrink-0 backdrop-blur-md relative overflow-hidden">
      {/* Animated Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/10 to-blue-500/5 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-l from-red-500/5 via-pink-500/10 to-purple-500/5 animate-pulse" style={{animationDelay: '1s'}}></div>

      {/* Left Section: Avatar + Username + Level */}
      <div className="flex items-center gap-0.5">
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-transparent bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 bg-clip-text text-xs font-bold text-center tracking-wider drop-shadow-lg">{playerData?.username?.replace('Player', '') || playerData?.name || "ShadyLTDx"}</p>
          <div
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={onAvatarClick}
            title="Click to view/chat with character"
          >
            <img
              src={selectedCharacter?.avatarUrl || selectedCharacter?.imageUrl || selectedCharacter?.avatarPath || "https://via.placeholder.com/64x64/1a1a1a/ff1493?text=👤"}
              alt="Character Avatar"
              loading="eager"
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.opacity = '1';
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== "https://via.placeholder.com/64x64/1a1a1a/ff1493?text=👤") {
                  target.src = "https://via.placeholder.com/64x64/1a1a1a/ff1493?text=👤";
                }
                target.style.opacity = '1';
              }}
              className="w-[88px] h-[88px] object-cover rounded-xl shadow-lg border-2 border-purple-500/50 cursor-pointer hover:border-purple-400/70 transition-all duration-500"
              style={{ opacity: 0, transition: 'opacity 0.5s ease-in-out' }}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-transparent bg-gradient-to-r from-yellow-200 via-orange-200 to-red-200 bg-clip-text text-xs font-bold text-center drop-shadow-lg tracking-wider">Level: {playerData?.level || 1}</span>
            <Progress value={(playerData?.xp || 0) / (playerData?.xpToNext || 100) * 100} className="h-2 w-20" />
          </div>
        </div>

        {/* Left Column: LustPoints and Lust Gems Stacked */}
        <div className="flex flex-col items-center gap-0.5 ml-2">
          {/* LustPoints Frame - ULTRA ENHANCED */}
          <div className="relative px-3 py-2 bg-gradient-to-br from-pink-600/30 via-rose-500/25 to-red-500/30 border-2 border-pink-400/50 rounded-xl shadow-2xl backdrop-blur-md hover:shadow-pink-500/40 hover:shadow-2xl transition-all duration-500 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-rose-400/15 to-transparent rounded-xl blur-md group-hover:blur-lg transition-all duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-red-500/10 rounded-xl animate-pulse"></div>
            <div className="relative flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-0.5">
                <Heart className="w-4 h-4 text-pink-300 drop-shadow-lg animate-pulse"/>
                <span className="text-transparent bg-gradient-to-r from-pink-100 via-rose-100 to-red-100 bg-clip-text text-sm font-black tracking-wider drop-shadow-lg">LustPoints</span>
                <Heart className="w-4 h-4 text-pink-300 drop-shadow-lg animate-pulse"/>
              </div>
              <span className="text-transparent bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 bg-clip-text font-black text-xs tracking-wider drop-shadow-xl">{Math.floor(user?.lp || playerData?.lp || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Lust Gems Frame - ULTRA ENHANCED */}
          <div className="relative px-3 py-2 bg-gradient-to-br from-purple-600/30 via-violet-500/25 to-indigo-500/30 border-2 border-purple-400/50 rounded-xl shadow-2xl backdrop-blur-md hover:shadow-purple-500/40 hover:shadow-2xl transition-all duration-500 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-violet-400/15 to-transparent rounded-xl blur-md group-hover:blur-lg transition-all duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-indigo-500/10 rounded-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="relative flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-0.5">
                <Gem className="w-4 h-4 text-purple-300 drop-shadow-lg animate-pulse" style={{animationDelay: '0.3s'}} />
                <span className="text-transparent bg-gradient-to-r from-purple-100 via-violet-100 to-indigo-100 bg-clip-text text-sm font-black whitespace-nowrap tracking-wider drop-shadow-lg">Lust Gems</span>
                <Gem className="w-4 h-4 text-purple-300 drop-shadow-lg animate-pulse" style={{animationDelay: '0.3s'}} />
              </div>
              <span className="text-transparent bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 bg-clip-text font-black text-xs tracking-wider drop-shadow-xl">{playerData?.lustGems || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Section: LP per Hour - ULTRA ENHANCED */}
      <div className="relative px-3 py-2 mx-2 bg-gradient-to-br from-yellow-600/35 via-orange-500/30 to-amber-500/35 border-2 border-yellow-400/60 rounded-xl shadow-2xl backdrop-blur-md hover:shadow-yellow-500/50 hover:shadow-2xl transition-all duration-500 group overflow-hidden min-w-[90px] max-w-[110px]">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/25 via-orange-400/20 to-amber-500/15 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/15 via-orange-400/10 to-amber-400/15 rounded-2xl animate-pulse"></div>
        <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500/30 via-orange-500/25 to-amber-500/30 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
        <div className="absolute top-1 right-1 opacity-50">
          <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
        </div>
        <div className="absolute bottom-1 left-1 opacity-30">
          <Sparkles className="w-2 h-2 text-orange-300 animate-pulse" style={{animationDelay: '1s'}} />
        </div>
        <div className="relative flex flex-col items-center gap-1 text-center">
          <span className="text-transparent bg-gradient-to-r from-yellow-200 via-orange-200 to-amber-200 bg-clip-text text-base font-bold tracking-wide drop-shadow-lg whitespace-nowrap leading-tight">LP per Hour</span>
          <span className="text-xl font-bold text-transparent bg-gradient-to-r from-yellow-200 via-orange-200 to-amber-200 bg-clip-text drop-shadow-2xl animate-pulse leading-none">∞</span>
          <span className="text-transparent bg-gradient-to-r from-yellow-100 via-orange-100 to-amber-100 bg-clip-text font-bold text-sm tracking-wide drop-shadow-lg leading-tight">{user?.lpPerHour || playerData?.lpPerHour || 250}</span>
        </div>
      </div>

      {/* Right Section: Energy and Boosters */}
      <div className="flex flex-col gap-0.5">
        {/* Energy Frame - ULTRA ENHANCED */}
        <div className={`relative px-3 py-2 bg-gradient-to-br from-blue-600/30 via-cyan-500/25 to-sky-500/30 border-2 border-blue-400/50 rounded-xl shadow-2xl backdrop-blur-md hover:shadow-blue-500/40 hover:shadow-2xl transition-all duration-500 group overflow-hidden ${
          ((user?.energy || playerData?.energy || 0) / (user?.maxEnergy || playerData?.maxEnergy || 1000)) > 0.95
            ? 'animate-pulse shadow-blue-400/60 shadow-2xl ring-2 ring-blue-400/60'
            : ''
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-400/15 to-transparent rounded-xl blur-md group-hover:blur-lg transition-all duration-300"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-sky-500/10 rounded-xl animate-pulse" style={{animationDelay: '0.7s'}}></div>
          <div className="relative flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-0.5">
              <Zap className={`w-4 h-4 text-blue-300 drop-shadow-lg ${
                ((user?.energy || playerData?.energy || 0) / (user?.maxEnergy || playerData?.maxEnergy || 1000)) > 0.95
                  ? 'animate-pulse text-blue-200'
                  : 'animate-pulse'
              }`} />
              <span className="text-transparent bg-gradient-to-r from-blue-100 via-cyan-100 to-sky-100 bg-clip-text text-sm font-black tracking-wider drop-shadow-lg">Energy</span>
              <Zap className={`w-4 h-4 text-blue-300 drop-shadow-lg ${
                ((user?.energy || playerData?.energy || 0) / (user?.maxEnergy || playerData?.maxEnergy || 1000)) > 0.95
                  ? 'animate-pulse text-blue-200'
                  : 'animate-pulse'
              }`} />
            </div>
            <span className="text-transparent bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 bg-clip-text font-black text-xs tracking-wider drop-shadow-xl transition-all duration-200">
              {user?.energy || playerData?.energy || 987}/{user?.maxEnergy || playerData?.maxEnergy || 1000}
            </span>
          </div>
        </div>

        {/* Boosters Frame - ULTRA ENHANCED */}
        <div className="relative px-3 py-3 bg-gradient-to-br from-green-600/30 via-emerald-500/25 to-teal-500/30 border-2 border-green-400/50 rounded-xl shadow-2xl backdrop-blur-md hover:shadow-green-500/40 hover:shadow-2xl transition-all duration-500 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-400/15 to-transparent rounded-xl blur-md group-hover:blur-lg transition-all duration-300"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-teal-500/10 rounded-xl animate-pulse" style={{animationDelay: '1.2s'}}></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          <div className="absolute top-1 right-1 opacity-40">
            <Sparkles className="w-2 h-2 text-green-300 animate-pulse" style={{animationDelay: '2s'}} />
          </div>
          <div className="relative text-center">
            <div className="flex items-center justify-center mb-1 gap-0.5">
              <Sparkles className="w-3 h-3 text-green-300 drop-shadow-lg animate-pulse" />
              <span className="text-transparent bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 bg-clip-text text-sm font-black tracking-wider drop-shadow-lg">Boosters</span>
              <Sparkles className="w-3 h-3 text-green-300 drop-shadow-lg animate-pulse" />
            </div>
            <div className="text-transparent bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 bg-clip-text text-xs font-black tracking-wider drop-shadow-xl">
              +0% LP [Inactive]
            </div>
          </div>
        </div>
      </div>
      
      {/* Dedicated Gallery Button */}
      <button
        onClick={onOpenGallery}
        className="ml-4 px-3 py-2 bg-gradient-to-br from-purple-700/50 via-pink-700/50 to-red-700/50 border-2 border-purple-500/70 rounded-lg shadow-xl backdrop-blur-md hover:shadow-purple-500/50 hover:shadow-2xl transition-all duration-500 hover:scale-105"
        title="Open Character Gallery"
      >
        <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
      </button>
    </div>
  );
}

/**
 * 🎯 MAIN COMPONENT WITH NEW MENU SYSTEM WRAPPER
 */
export default function PlayerStatsPanel(props: PlayerStatsPanelProps) {
  // Initialize the menu system once
  useEffect(() => {
    console.log('🎯 [MENU] Initializing new menu system in PlayerStatsPanel...');
    try {
      initializeMenuRegistry();
      console.log('✅ [MENU] Menu system initialized successfully!');
      toast.success('🎆 New menu system loaded!', {
        position: 'top-center',
        duration: 2000,
        style: {
          background: '#1f2937',
          color: '#f3f4f6',
          border: '1px solid #8b5cf6'
        }
      });
    } catch (error) {
      console.error('❌ [MENU] Failed to initialize menu system:', error);
      toast.error('Failed to load new menu system', {
        position: 'top-center'
      });
    }
  }, []);
  
  return (
    <MenuProvider>
      {/* Original PlayerStatsPanel UI */}
      <PlayerStatsPanelCore {...props} />
      
      {/* NEW MENU SYSTEM CONTROLS */}
      <NewMenuButtons />
      
      {/* Menu Portal Host - Renders active menus */}
      <MenuHost />
    </MenuProvider>
  );
}