import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Character, UserCharacter } from "@shared/schema";

interface CharacterDisplayProps {
  character: Character | null;
  userCharacter?: UserCharacter;
  onTap: () => void;
  tapPending: boolean;
  lastTapGain?: number;
}

export function CharacterDisplay({ 
  character, 
  userCharacter, 
  onTap, 
  tapPending,
  lastTapGain 
}: CharacterDisplayProps) {
  const [showTapEffect, setShowTapEffect] = useState(false);

  const handleTap = () => {
    if (tapPending) return;
    
    onTap();
    setShowTapEffect(true);
    setTimeout(() => setShowTapEffect(false), 1000);
  };

  if (!character) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="character-frame max-w-md w-full p-8 text-center">
          <CardContent className="pt-6">
            <p className="text-game-cyan">No character selected</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="character-frame max-w-md w-full animate-float glow-effect" data-testid="character-display">
        <CardContent className="p-8">
          <div className="text-center mb-4">
            <h3 className="font-orbitron text-xl font-bold text-game-gold" data-testid="text-character-name">
              {character.name}
            </h3>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <Badge variant="secondary" className="bg-game-cyan/20 text-game-cyan">
                <span data-testid="text-character-mood">Mood: {character.mood}</span>
              </Badge>
              <Badge variant="secondary" className="bg-game-amber/20 text-game-amber">
                <span data-testid="text-character-level">Level {character.level}</span>
              </Badge>
            </div>
          </div>

          {/* Character Image/Animation Area */}
          <div className="relative mb-6">
            <img 
              src="https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=300&h=400&fit=crop" 
              alt={`Character ${character.name}`}
              className="w-full h-80 object-cover rounded-xl shadow-2xl" 
              data-testid="img-character"
            />
            
            {/* Tap interaction overlay */}
            <div 
              className={`absolute inset-0 rounded-xl cursor-pointer transition-colors ${
                tapPending ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              onClick={handleTap}
              data-testid="button-character-tap"
            >
              {/* Tap effect particles would appear here */}
            </div>
            
            {/* LP gain indicator */}
            <div 
              className={`absolute top-4 right-4 bg-game-accent/90 text-white px-2 py-1 rounded-full text-sm font-bold transition-opacity ${
                showTapEffect && lastTapGain ? 'opacity-100' : 'opacity-0'
              }`}
              data-testid="text-tap-gain"
            >
              +{lastTapGain || 125} LP
            </div>
          </div>

          {/* Character Stats */}
          {userCharacter && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-effect">
                <CardContent className="p-3 text-center">
                  <div className="text-game-cyan text-sm">Affection</div>
                  <div className="font-bold text-lg" data-testid="text-affection">
                    {userCharacter.affection}%
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-effect">
                <CardContent className="p-3 text-center">
                  <div className="text-game-gold text-sm">Bond Level</div>
                  <div className="font-bold text-lg" data-testid="text-bond-level">
                    {userCharacter.bondLevel}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
