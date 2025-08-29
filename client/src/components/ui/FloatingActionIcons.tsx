import React from "react";
import { Button } from "@/components/ui/button";
import { Activity, Crown, Settings } from "lucide-react";

interface FloatingActionIconsProps {
  onOpenWheel: () => void;
  onOpenVIP: () => void;
  onOpenAdmin: () => void;
}

export default function FloatingActionIcons({
  onOpenWheel,
  onOpenVIP,
  onOpenAdmin
}: FloatingActionIconsProps) {
  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-50">
      {/* Wheel Game Icon */}
      <Button
        variant="default"
        size="icon"
        className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:via-yellow-400 hover:to-orange-400 border-2 border-yellow-300/70 shadow-2xl hover:shadow-yellow-400/40 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        onClick={onOpenWheel}
        data-testid="button-wheel-game"
      >
        <Activity className="w-7 h-7 text-white drop-shadow-lg" />
      </Button>

      {/* VIP Icon */}
      <Button
        variant="default"
        size="icon"
        className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 hover:from-purple-500 hover:via-violet-500 hover:to-purple-600 border-2 border-purple-300/70 shadow-2xl hover:shadow-purple-400/40 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        onClick={onOpenVIP}
        data-testid="button-vip"
      >
        <Crown className="w-7 h-7 text-white drop-shadow-lg" />
      </Button>

{/* Admin button hidden for production users */}
    </div>
  );
}