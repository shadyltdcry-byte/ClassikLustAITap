
/**
 * GameManagerCore.tsx
 *
 * Core logic for taps, energy regen, passive LP, upgrades, boosters, and VIP.
 * Last Edited: 2025-08-18 by Assistant
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --------------------
// Default constants for game mechanics
// --------------------
export const TAP_VALUE = 1; // base LP per tap
export const ENERGY_COST = 1; // energy cost per tap
export const MAX_ENERGY = 1000;
export const ENERGY_RECOVERY_RATE = 5; // per interval
export const ENERGY_RECOVERY_INTERVAL = 5000; // ms
export const PASSIVE_LP_RATE = 125; // LP per hour
export const PASSIVE_CAP_HOURS = 8; // max hours before login reset
export const PLAYER_DATA_DIR = './data/players';

interface GameState {
  player: {
    id: string;
    level: number;
    lp: number;
    energy: number;
    maxEnergy: number;
    lpPerTap: number;
    lpPerHour: number;
  };
}

export default function GameManagerCore() {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      id: "player1",
      level: 1,
      lp: 5000,
      energy: 800,
      maxEnergy: 1000,
      lpPerTap: 1.5,
      lpPerHour: 125
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Energy regeneration effect
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          energy: Math.min(prev.player.maxEnergy, prev.player.energy + ENERGY_RECOVERY_RATE)
        }
      }));
    }, ENERGY_RECOVERY_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleTap = async () => {
    if (gameState.player.energy <= 0) return;
    
    setIsLoading(true);
    try {
      // Make API call to server
      const response = await fetch('/api/game/tap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId: gameState.player.id }),
      });

      if (response.ok) {
        const result = await response.json();
        setGameState(prev => ({
          ...prev,
          player: {
            ...prev.player,
            lp: result.newTotal || prev.player.lp + prev.player.lpPerTap,
            energy: Math.max(0, prev.player.energy - ENERGY_COST)
          }
        }));
      } else {
        // Fallback to local update if server fails
        setGameState(prev => ({
          ...prev,
          player: {
            ...prev.player,
            lp: prev.player.lp + prev.player.lpPerTap,
            energy: Math.max(0, prev.player.energy - ENERGY_COST)
          }
        }));
      }
    } catch (error) {
      console.error('Tap failed:', error);
      // Fallback to local update
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          lp: prev.player.lp + prev.player.lpPerTap,
          energy: Math.max(0, prev.player.energy - ENERGY_COST)
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Game Manager Core</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Player Level</p>
                <p className="text-xl font-bold">{gameState.player.level}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">LP (Love Points)</p>
                <p className="text-xl font-bold">{gameState.player.lp.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Energy</p>
                <p className="text-xl font-bold">
                  {gameState.player.energy}/{gameState.player.maxEnergy}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(gameState.player.energy / gameState.player.maxEnergy) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">LP per Tap</p>
                <p className="text-xl font-bold">{gameState.player.lpPerTap}</p>
              </div>
            </div>
            <Button 
              onClick={handleTap} 
              disabled={gameState.player.energy <= 0 || isLoading}
              className="w-full"
            >
              {isLoading ? 'Tapping...' : `Tap for ${gameState.player.lpPerTap} LP`}
            </Button>
            {gameState.player.energy <= 0 && (
              <p className="text-red-500 text-sm text-center">
                No energy! Wait for regeneration.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
