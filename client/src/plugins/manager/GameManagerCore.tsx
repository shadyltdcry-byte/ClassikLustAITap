/**
 * GameManagerCore.tsx
 *
 * Core logic for taps, energy regen, passive LP, upgrades, boosters, and VIP.
 * Last Edited: 2025-08-18 by Assistant
 */

// Removed database imports as per user request
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --------------------
// Default constants for game mechanics
// --------------------
export const TAP_VALUE = 1; // base LP per tap
export const ENERGY_COST = 1; // energy cost per tap
export const MAX_ENERGY = 100;
export const ENERGY_RECOVERY_RATE = 1; // per interval
export const ENERGY_RECOVERY_INTERVAL = 5000; // ms
export const PASSIVE_LP_RATE = 10; // LP per hour
export const PASSIVE_CAP_HOURS = 8; // max hours before login reset

// Server removed as per user request - now using plugin-based approach

interface GameState {
  player: {
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
      level: 1,
      lp: 5000,
      energy: 800,
      maxEnergy: 1000,
      lpPerTap: 1.5,
      lpPerHour: 125
    }
  });

  const handleTap = () => {
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        lp: prev.player.lp + prev.player.lpPerTap,
        energy: Math.max(0, prev.player.energy - 1)
      }
    }));
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Game Manager Core</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p>Player Level: {gameState.player.level}</p>
              <p>LP: {gameState.player.lp}</p>
              <p>Energy: {gameState.player.energy}/{gameState.player.maxEnergy}</p>
            </div>
            <Button onClick={handleTap} disabled={gameState.player.energy <= 0}>
              Tap for LP
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
      res.status(500).json([]);
    }
  });

  app.listen(port, () => {
    console.log(`Server running at ${SERVER_BASE_URL}`);
  });
};

// --------------------
// Tap function
// --------------------
export async function handleTap(playerId: string): Promise<Player> {
  const player = await getPlayer(playerId);
  if (player.energy <= 0) {
    throw new Error("Not enough energy!");
  }
  // Base tap LP
  let tapLP = TAP_VALUE;
  // Apply upgrades that increase tap
  player.upgrades?.forEach((upg: Upgrade) => {
    if (upg.type === "tap") tapLP += upg.bonus * (upg.currentLevel || 1);
  });
  // Apply active tap boosters
  const tapBooster = player.activeBoosters?.tap;
  if (tapBooster && tapBooster.expires > Date.now()) {
    tapLP *= tapBooster.multiplier;
  }
  // Update player
  player.lp += tapLP;
  player.energy -= ENERGY_COST;
  await updatePlayer(playerId, player);
  return player;
}

// --------------------
// Passive LP calculation
// --------------------
export async function calculatePassiveIncome(playerId: string): Promise<Player> {
  const player = await getPlayer(playerId);
  const now = Date.now();
  const lastLogin = player.lastLogin || now;
  const elapsedHours = Math.floor((now - lastLogin) / (1000 * 60 * 60));
  // Base passive LP
  let passiveRate = PASSIVE_LP_RATE;
  // Upgrades that affect passive LP
  player.upgrades?.forEach((upg: Upgrade) => {
    if (upg.type === "passiveLP") passiveRate += upg.bonus * (upg.currentLevel || 1);
  });
  // VIP multiplier
  if (player.isVIP) passiveRate *= 1.5;
  // Active passive booster
  const passiveBooster = player.activeBoosters?.passive;
  if (passiveBooster && passiveBooster.expires > now) {
    passiveRate *= passiveBooster.multiplier;
  }
  // Cap hours
  const cappedHours = Math.min(elapsedHours, PASSIVE_CAP_HOURS);
  player.lp += cappedHours * passiveRate;
  player.lastLogin = now;
  await updatePlayer(playerId, player);
  return player;
}

// --------------------
// Energy regen loop
// --------------------
export async function recoverEnergy(playerId: string): Promise<Player> {
  const player = await getPlayer(playerId);
  if (player.energy < MAX_ENERGY) {
    let regenRate = ENERGY_RECOVERY_RATE;
    // Energy booster
    const energyBooster = player.activeBoosters?.energy;
    if (energyBooster && energyBooster.expires > Date.now()) {
      regenRate *= energyBooster.multiplier;
    }
    player.energy = Math.min(player.energy + regenRate, MAX_ENERGY);
    await updatePlayer(playerId, player);
  }
  return player;
}

// --------------------
// On login refresh
// --------------------
export async function onPlayerLogin(playerId: string): Promise<Player> {
  let player = await calculatePassiveIncome(playerId);
  await recoverEnergy(playerId);
  player.lastLogin = Date.now();
  await updatePlayer(playerId, player);
  return player;
}

// --------------------
// Optional: reset boosters after expiration
// --------------------
export async function cleanupExpiredBoosters(playerId: string): Promise<Player> {
  const player = await getPlayer(playerId);
  const now = Date.now();
  if (player.activeBoosters) {
    for (const key of Object.keys(player.activeBoosters)) {
      const booster = player.activeBoosters[key as keyof typeof player.activeBoosters];
      if (booster && booster.expires <= now) {
        delete player.activeBoosters[key as keyof typeof player.activeBoosters];
      }
    }
  }
  await updatePlayer(playerId, player);
  return player;
}

// Start the server
startServer();
