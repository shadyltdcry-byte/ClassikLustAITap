


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

// Fallback when no character is selected
const defaultCharacter: Character = {
  id: "no-character-selected",
  name: "Select Character",
  personality: "neutral",
  bio: null,
  description: null,
  backstory: "Please select a character to interact with!",
  mood: "neutral",
  level: 1,
  isNsfw: false,
  isVip: false,
  levelRequirement: 1,
  isEnabled: true,
  customTriggers: [],
  avatarPath: "/uploads/placeholder-avatar.jpg",
  imageUrl: "/uploads/placeholder-avatar.jpg",
  avatarUrl: "/uploads/placeholder-avatar.jpg",
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

  // If this is the default "Select Character" state, should open gallery, not tap
  const shouldOpenGallery = character?.id === "no-character-selected";

  return (
    <div className="px-4 pb-6">
      <div className="relative bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-purple-500/30">
        {/* Character Info */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold gradient-text">{character?.name || "Unnamed"}</h2>
          <p className="text-gray-400 text-sm">{character?.backstory || "Tap to interact!"}</p>
        </div>

        {/* Character Main Image Container */}
        <div className="relative mx-auto max-w-xs mb-6">
          <div className="relative">
            <img
              src={
                (character?.avatarPath && character.avatarPath !== 'null' && character.avatarPath !== '/uploads/undefined') ? character.avatarPath :
                (character?.imageUrl && character.imageUrl !== 'null' && character.imageUrl !== '/uploads/undefined') ? character.imageUrl :
                (character?.avatarUrl && character.avatarUrl !== 'null' && character.avatarUrl !== '/uploads/undefined') ? character.avatarUrl :
                '/uploads/placeholder-avatar.jpg'
              }
              alt={character?.name || "Player"}
              onClick={shouldOpenGallery ? onAvatarClick : handleTap}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== window.location.origin + '/uploads/placeholder-avatar.jpg') {
                  target.src = '/uploads/placeholder-avatar.jpg';
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
              <img src="/media/floatinghearts.png" alt="hearts" className="w-8 h-8" />
            </div>

            {tapEffect && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 animate-float-up">
                  <img src="/media/floatinghearts.png" alt="hearts" className="w-6 h-6" />
                </div>
                <div className="absolute top-1/3 right-1/3 animate-float-up" style={{ animationDelay: '0.2s' }}>
                  <img src="/media/floatinghearts.png" alt="hearts" className="w-5 h-5" />
                </div>
                <div className="absolute top-1/2 left-1/2 animate-float-up" style={{ animationDelay: '0.4s' }}>
                  <img src="/media/floatinghearts.png" alt="hearts" className="w-7 h-7" />
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