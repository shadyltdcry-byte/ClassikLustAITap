/**
 * Wheel.tsx
 * Combined Wheel / WheelModal / WheelPrizes plugin
 * VIP / Event gated
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GameManagerCore } from "@/game/GameManagerCore";

interface WheelPrize {
  id: number;
  name: string;
  type: string; // e.g., "LP", "Booster", "Item"
  amount: number;
  rarity: string;
}

interface WheelProps {
  playerId: string;
  isVIP: boolean;
  isEventActive: boolean;
}

export default function Wheel({ playerId, isVIP, isEventActive }: WheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizes, setPrizes] = useState<WheelPrize[]>([]);
  const [lastPrize, setLastPrize] = useState<WheelPrize | null>(null);

  // Pull prizes from GameManagerCore or DB
  useEffect(() => {
    const wheelPrizes = GameManagerCore.getWheelPrizes();
    setPrizes(wheelPrizes);
  }, []);

  const spinWheel = () => {
    if (!isVIP && !isEventActive) return alert("Wheel is VIP/Event only right now!");
    if (isSpinning) return;

    setIsSpinning(true);

    setTimeout(() => {
      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      GameManagerCore.awardWheelPrize(playerId, prize);
      setLastPrize(prize);
      setIsSpinning(false);
    }, 2000); // simulate spinning animation
  };

  return (
    <Card className="bg-gray-800/50 border-gray-600 p-4">
      <CardHeader>
        <CardTitle className="text-white">Spin the Wheel</CardTitle>
        <CardDescription className="text-gray-400">
          VIP/Event only! Spin for rewards.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={spinWheel}
          disabled={isSpinning || (!isVIP && !isEventActive)}
        >
          {isSpinning ? "Spinning..." : "Spin"}
        </Button>

        {lastPrize && (
          <div className="mt-4 text-white">
            Last Prize: {lastPrize.name} x{lastPrize.amount} ({lastPrize.rarity})
          </div>
        )}

        <div className="mt-4">
          <h4 className="text-white mb-2">Prizes:</h4>
          <ul className="text-gray-300">
            {prizes.map((p) => (
              <li key={p.id}>
                {p.name} x{p.amount} ({p.rarity})
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}