import React from "react";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";

interface PlayerStatsPanelProps {
  user?: any;
  playerData?: any;
  selectedCharacter?: any;
  onAvatarClick: () => void;
}

export default function PlayerStatsPanel({ 
  user, 
  playerData, 
  selectedCharacter, 
  onAvatarClick 
}: PlayerStatsPanelProps) {
  return (
    <div className="flex justify-between items-center p-4 pr-6 bg-gradient-to-r from-pink-900/30 to-red-900/30 border-b border-pink-500/30 flex-shrink-0">
      
      {/* Left Section: Avatar + Username + Level */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <p className="font-medium text-sm text-center">{playerData?.username?.replace('Player', '') || playerData?.name || "ShadyLTDx"}</p>
          <div 
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={onAvatarClick}
            title="Click to open Character Gallery"
          >
            <img
              src={selectedCharacter?.avatarUrl || selectedCharacter?.imageUrl || selectedCharacter?.avatarPath || "https://via.placeholder.com/64x64/1a1a1a/ff1493?text=👤"}
              alt="Character Avatar"
              loading="eager"
              onLoad={(e) => {
                // Smooth fade-in effect when image loads
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
              className="w-[74px] h-[74px] object-cover rounded-xl shadow-lg border-2 border-purple-500/50 cursor-pointer hover:border-purple-400/70 transition-all duration-500"
              style={{ opacity: 0, transition: 'opacity 0.5s ease-in-out' }}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-white text-lg font-bold text-center drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">Level: {playerData?.level || 1}</span>
            <Progress value={(playerData?.xp || 0) / (playerData?.xpToNext || 100) * 100} className="h-2 w-20" />
          </div>
        </div>

        {/* Left Column: LustPoints and Lust Gems Stacked */}
        <div className="flex flex-col gap-1 ml-3">
          {/* LustPoints Frame */}
          <div className="relative px-2 py-1 bg-gradient-to-r from-pink-600/20 to-pink-500/20 border border-pink-400/30 rounded-lg shadow-lg backdrop-blur-sm hover:shadow-pink-500/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent rounded-lg blur-sm"></div>
            <div className="relative flex items-center gap-1">
              <img src="/media/floatinghearts.png" alt="LP" className="w-4 h-4" />
              <span className="text-pink-200 text-xs font-bold">LustPoints:</span>
              <span className="text-pink-100 font-bold text-xs">{user?.lp || playerData?.lp || 5026}</span>
            </div>
          </div>

          {/* Lust Gems Frame */}
          <div className="relative px-2 py-1 bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-400/30 rounded-lg shadow-lg backdrop-blur-sm hover:shadow-purple-500/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg blur-sm"></div>
            <div className="relative flex items-center gap-1">
              <img src="/media/lustgems.png" alt="Gems" className="w-4 h-4" />
              <span className="text-purple-200 text-xs font-bold whitespace-nowrap">Lust Gems:</span>
              <span className="text-purple-100 font-bold text-xs">{playerData?.lustGems || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Section: LP per Hour */}
      <div className="relative px-4 py-3 mx-6 bg-gradient-to-r from-yellow-600/20 to-orange-500/20 border border-yellow-400/30 rounded-xl shadow-xl backdrop-blur-sm hover:shadow-yellow-500/30 hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/15 to-orange-500/10 rounded-xl blur-sm"></div>
        <div className="relative flex flex-col items-center gap-1 text-center">
          <span className="text-yellow-200 text-sm font-bold">LP per Hour</span>
          <div className="flex items-center gap-2">
            <img src="/media/floatinghearts.png" alt="LP" className="w-4 h-4" />
            <span className="text-lg font-bold text-transparent bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text">∞</span>
            <img src="/media/floatinghearts.png" alt="LP" className="w-4 h-4" />
          </div>
          <span className="text-yellow-100 font-bold text-sm">{user?.lpPerHour || playerData?.lpPerHour || 250}</span>
        </div>
      </div>

      {/* Right Section: Energy and Boosters */}
      <div className="flex flex-col gap-1">
        {/* Energy Frame */}
        <div className="relative px-2 py-1 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-400/30 rounded-lg shadow-lg backdrop-blur-sm hover:shadow-blue-500/20 hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg blur-sm"></div>
          <div className="relative flex items-center gap-1">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-blue-200 text-xs font-bold">Energy:</span>
            <span className="text-blue-100 font-bold text-xs">
              {user?.energy || playerData?.energy || 987}/{user?.maxEnergy || playerData?.maxEnergy || 1000}
            </span>
          </div>
        </div>

        {/* Boosters Frame */}
        <div className="relative px-2 py-2 bg-gradient-to-r from-green-600/20 to-emerald-500/20 border border-green-400/30 rounded-lg shadow-lg backdrop-blur-sm hover:shadow-green-500/20 hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg blur-sm"></div>
          <div className="relative text-center">
            <div className="flex items-center justify-center mb-1">
              <span className="text-green-200 text-xs font-bold">Boosters</span>
            </div>
            <div className="text-green-100 text-xs">
              +20% LP [2:30]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}