import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatNumber, getEnergyPercentage } from "@/lib/gameUtils";
import type { User } from "@shared/schema";

interface TopStatsBarProps {
  user: User;
  onToggleAdmin: () => void;
}

export function TopStatsBar({ user, onToggleAdmin }: TopStatsBarProps) {
  return (
    <div className="h-20 w-full flex items-center justify-between px-4 glass-effect border-b border-game-accent/20">
      {/* Player Identity */}
      <div className="flex items-center space-x-4" data-testid="player-identity">
        <div className="relative">
          <Avatar className="w-12 h-12 border-2 border-game-gold">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop" alt="Player Avatar" />
            <AvatarFallback className="bg-game-primary text-game-gold font-bold">
              {user.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-game-gold text-game-bg text-xs font-bold px-1 rounded-full">
            {user.level}
          </div>
        </div>
        <div>
          <h2 className="font-orbitron font-bold text-game-gold" data-testid="text-username">
            {user.username}
          </h2>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-game-cyan">Charisma:</span>
            <span className="text-white font-semibold" data-testid="text-charisma">
              {formatNumber(user.charisma)}
            </span>
          </div>
        </div>
      </div>

      {/* Core LP Info */}
      <div className="text-center" data-testid="lp-display">
        <div className="font-orbitron text-2xl font-bold text-game-cyan">
          <span data-testid="text-lp">{formatNumber(user.lp)}</span> LP
        </div>
        <div className="text-sm text-gray-300">
          <i className="fas fa-clock mr-1"></i>
          <span data-testid="text-lp-per-hour">+{formatNumber(user.lpPerHour)}</span> LP/hour
        </div>
      </div>

      {/* Resources & Controls */}
      <div className="flex items-center space-x-6">
        {/* Energy Display */}
        <div className="text-center" data-testid="energy-display">
          <div className="flex items-center space-x-1">
            <i className="fas fa-bolt text-game-amber"></i>
            <span className="font-semibold" data-testid="text-energy">{user.energy}</span>
            <span className="text-gray-400">/ <span data-testid="text-max-energy">{user.maxEnergy}</span></span>
          </div>
          <div className="w-16 mt-1">
            <Progress 
              value={getEnergyPercentage(user.energy, user.maxEnergy)} 
              className="h-1"
              data-testid="progress-energy"
            />
          </div>
        </div>

        {/* Active Boosters Placeholder */}
        <div className="flex space-x-2" data-testid="active-boosters">
          <div 
            className="w-8 h-8 bg-game-gold/20 border border-game-gold rounded-lg flex items-center justify-center animate-pulse-glow" 
            title="2x LP Booster - Active"
          >
            <i className="fas fa-fire text-game-gold text-xs"></i>
          </div>
          <div 
            className="w-8 h-8 bg-game-cyan/20 border border-game-cyan rounded-lg flex items-center justify-center"
            title="Energy Regen Boost - Active"
          >
            <i className="fas fa-zap text-game-cyan text-xs"></i>
          </div>
        </div>

        {/* Admin Toggle */}
        <Button
          variant="outline"
          size="sm"
          className="w-8 h-8 p-0 bg-red-600/20 border-red-400 text-red-400 hover:bg-red-600/40"
          onClick={onToggleAdmin}
          title="Admin Panel"
          data-testid="button-admin-toggle"
        >
          <i className="fas fa-cog text-xs"></i>
        </Button>
      </div>
    </div>
  );
}
