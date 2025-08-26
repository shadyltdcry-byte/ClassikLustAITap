


import { useState } from "react";
//import { Button } from "@/components/ui/button";
import type { Character, User, GameStats } from "@shared/schema";

interface CharacterDisplayProps {
  character?: Character; // made optional
  user: User;
  stats?: GameStats;
  onTap: (event: React.MouseEvent) => void;
  onAvatarClick?: () => void; // New prop for avatar click
  isTapping: boolean;
}

// Fallback default character
const defaultCharacter: Character = {
  id: "550e8400-e29b-41d4-a716-446655440001", // Valid UUID format
  name: "Seraphina",
  personality: "playful",
  backstory: "A mysterious and playful character who loves to chat and have fun!",
  mood: "flirty",
  level: 1,
  isNsfw: false,
  isVip: false,
  levelRequirement: 1,
  isEnabled: true,
  customTriggers: [],
  createdAt: new Date(),
};

export default function CharacterDisplay({
  character = defaultCharacter,
  user,
  onTap,
  onAvatarClick,
  isTapping,
}: CharacterDisplayProps) {
  const [tapEffect, setTapEffect] = useState(false);

  const handleTap = (event: React.MouseEvent) => {
    if (user.energy <= 0 || isTapping) return;

    setTapEffect(true);
    onTap(event);

    setTimeout(() => {
      setTapEffect(false);
    }, 200);
  };

  return (
    <div className="px-4 pb-6">
      <div className="relative bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-purple-500/30">
        {/* Character Info with Avatar */}
        <div className="flex items-center gap-4 mb-4">
          {/* Bigger Avatar with Square Round Edges - Clickable for Gallery */}
          <div 
            className="relative w-20 h-20 cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={onAvatarClick}
            title="Click to open Character Gallery"
          >
            <img
              src={character?.avatarPath || character?.imageUrl || character?.avatarUrl || '/default-character.jpg'}
              alt={character?.name || "Player"}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== window.location.origin + '/default-character.jpg') {
                  target.src = '/default-character.jpg';
                }
              }}
              className="w-20 h-20 object-cover rounded-xl shadow-lg border-2 border-purple-500/50"
            />
          </div>
          
          <div className="flex-1 text-left">
            <h2 className="text-2xl font-bold gradient-text">{character?.name || "Unnamed"}</h2>
            <p className="text-gray-400 text-sm">{character?.backstory || "Tap to interact!"}</p>
          </div>
        </div>

        {/* Character Main Image Container */}
        <div className="relative mx-auto max-w-xs mb-6">
          <div className="relative">
            <img
              src={character?.avatarPath || character?.imageUrl || character?.avatarUrl || '/default-character.jpg'}
              alt={character?.name || "Player"}
              onClick={handleTap}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== window.location.origin + '/default-character.jpg') {
                  target.src = '/default-character.jpg';
                }
              }}
              className={`w-full h-auto aspect-[3/4] object-cover rounded-2xl shadow-2xl cursor-pointer transform hover:scale-105 transition-transform duration-200 ${
                tapEffect ? 'tap-effect' : ''
              } ${user.energy <= 0 ? 'grayscale opacity-50' : ''}`}
              style={{
                filter: user.energy <= 0 ? 'grayscale(100%)' : 'none'
              }}
            />

            {/* Tap Effect Overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl transition-opacity duration-200 pointer-events-none ${
                tapEffect ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Floating Hearts */}
            <div
              className={`absolute top-4 right-4 transition-all duration-500 pointer-events-none ${
                tapEffect ? 'opacity-100 animate-bounce' : 'opacity-0'
              }`}
            >
              <div className="text-red-400 text-2xl">❤️</div>
            </div>

            {tapEffect && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 animate-float-up">
                  <span className="text-pink-400 text-lg">💕</span>
                </div>
                <div className="absolute top-1/3 right-1/3 animate-float-up" style={{ animationDelay: '0.2s' }}>
                  <span className="text-red-400 text-lg">❤️</span>
                </div>
                <div className="absolute top-1/2 left-1/2 animate-float-up" style={{ animationDelay: '0.4s' }}>
                  <span className="text-pink-500 text-lg">💖</span>
                </div>
              </div>
            )}

            {user.energy <= 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">🔋</div>
                  <p className="text-sm">No Energy!</p>
                  <p className="text-xs text-gray-400">Wait for energy to regenerate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}