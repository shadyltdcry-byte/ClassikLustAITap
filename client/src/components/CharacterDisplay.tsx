import { useState } from "react";
//import { Button } from "@/components/ui/button";
import type { Character, User, GameStats } from "@shared/schema";

interface CharacterDisplayProps {
  character: Character;
  user: User;
  stats?: GameStats;
  onTap: (event: React.MouseEvent) => void;
  isTapping: boolean;
}

export default function CharacterDisplay({ character, user, onTap, isTapping }: CharacterDisplayProps) {
  const [tapEffect, setTapEffect] = useState(false);

  const handleTap = (event: React.MouseEvent) => {
    if (user.energy <= 0 || isTapping) return;

    setTapEffect(true);
    onTap(event);

    // Remove tap effect after animation
    setTimeout(() => {
      setTapEffect(false);
    }, 200);
  };

  return (
    <div className="px-4 pb-6">
      <div className="relative bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-purple-500/30">
        {/* Character Info */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold gradient-text">{character.name}</h2>
          <p className="text-gray-400 text-sm">{character.bio || "Tap to interact!"}</p>
        </div>

        {/* Character Image Container */}
        <div className="relative mx-auto max-w-xs mb-6">
          <div className="relative">
            <img
              src={character.imageUrl || character.avatarUrl || '/uploads/placeholder.jpg'}
              alt={character.name}
              onClick={handleTap}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // Try different fallback sources
                if (target.src.includes('/uploads/')) {
                  target.src = character.avatarUrl || 'https://placehold.co/256x320/666666/FFFFFF?text=' + encodeURIComponent(character.name);
                } else if (!target.src.includes('placehold.co')) {
                  target.src = 'https://placehold.co/256x320/666666/FFFFFF?text=' + encodeURIComponent(character.name);
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

            {/* Additional floating hearts animation */}
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

            {/* No Energy Overlay */}
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