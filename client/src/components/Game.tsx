import { useEffect, useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import { TopStatsBar } from "./TopStatsBar";
import { NewsTicker } from "./NewsTicker";
import { CharacterDisplay } from "./CharacterDisplay";
import { GameUtilities } from "./GameUtilities";
import { BottomTabs } from "./BottomTabs";
import { AdminPanel } from "./AdminPanel";
import { useToast } from "@/hooks/use-toast";

export function Game() {
  const {
    user,
    currentCharacter,
    upgrades,
    userUpgrades,
    userLoading,
    handleTick,
    handleTap,
    purchaseUpgrade,
    spinWheel,
    addLP,
    maxEnergy,
    tapPending,
    upgradePending,
    wheelPending,
  } = useGameState();

  const [adminOpen, setAdminOpen] = useState(false);
  const [lastTapGain, setLastTapGain] = useState<number>();
  const { toast } = useToast();

  // Run tick calculation on component mount and periodically
  useEffect(() => {
    handleTick();
    const interval = setInterval(handleTick, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const handleCharacterTap = async () => {
    if (!user || user.energy < 1) {
      toast({
        title: "Not enough energy!",
        description: "Wait for energy to regenerate or use a booster.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await handleTap();
      if (result && typeof result === 'object' && 'lpGain' in result) {
        setLastTapGain(result.lpGain as number);
      }
    } catch (error) {
      toast({
        title: "Tap failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSpinWheel = async () => {
    if (!user || user.lp < 500) {
      toast({
        title: "Insufficient LP!",
        description: "You need at least 500 LP to spin the wheel.",
        variant: "destructive",
      });
      return;
    }

    try {
      await spinWheel();
      toast({
        title: "Wheel spun!",
        description: "Check your rewards!",
      });
    } catch (error) {
      toast({
        title: "Spin failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = async (data: { upgradeId: string; level: number }) => {
    try {
      await purchaseUpgrade(data);
      toast({
        title: "Upgrade purchased!",
        description: "Your stats have been improved.",
      });
    } catch (error) {
      toast({
        title: "Upgrade failed",
        description: "Not enough LP or other error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleAdminAddLP = (amount: number) => {
    addLP(amount);
    toast({
      title: "LP Added",
      description: `Added ${amount.toLocaleString()} LP to your account.`,
    });
  };

  const handleAdminMaxEnergy = () => {
    maxEnergy();
    toast({
      title: "Energy Restored",
      description: "Your energy has been fully restored.",
    });
  };

  if (userLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-game-bg via-game-secondary to-game-primary">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-game-cyan mb-4"></i>
          <p className="text-game-cyan font-orbitron">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-game-bg via-game-secondary to-game-primary">
        <div className="text-center">
          <p className="text-red-400 font-orbitron">Failed to load user data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col relative bg-gradient-to-br from-game-bg via-game-secondary to-game-primary" data-testid="game-layout">
      {/* Top Stats Bar */}
      <TopStatsBar 
        user={user} 
        onToggleAdmin={() => setAdminOpen(!adminOpen)} 
      />
      
      {/* News Ticker */}
      <NewsTicker />
      
      {/* Main Game Area */}
      <div className="flex-1 flex">
        {/* Character Display */}
        <CharacterDisplay 
          character={currentCharacter}
          onTap={handleCharacterTap}
          tapPending={tapPending}
          lastTapGain={lastTapGain}
        />
        
        {/* Right Sidebar */}
        <GameUtilities 
          onSpinWheel={handleSpinWheel}
          wheelPending={wheelPending}
        />
      </div>
      
      {/* Bottom Tabs */}
      <BottomTabs 
        user={user}
        upgrades={upgrades}
        userUpgrades={userUpgrades}
        onPurchaseUpgrade={handleUpgrade}
        upgradePending={upgradePending}
      />
      
      {/* Admin Panel */}
      <AdminPanel 
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onAddLP={handleAdminAddLP}
        onMaxEnergy={handleAdminMaxEnergy}
      />
    </div>
  );
}
