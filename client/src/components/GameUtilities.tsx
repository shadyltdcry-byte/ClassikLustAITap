import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GameUtilitiesProps {
  onSpinWheel: () => void;
  wheelPending: boolean;
}

export function GameUtilities({ onSpinWheel, wheelPending }: GameUtilitiesProps) {
  return (
    <div className="w-80 p-4 space-y-4">
      {/* Reward Wheel */}
      <Card className="glass-effect" data-testid="card-reward-wheel">
        <CardHeader className="pb-3">
          <CardTitle className="font-orbitron font-bold text-game-gold flex items-center text-sm">
            <i className="fas fa-dharmachakra mr-2"></i>
            Reward Wheel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div 
              className={`w-32 h-32 mx-auto bg-gradient-to-br from-game-accent to-game-cyan rounded-full border-4 border-game-gold flex items-center justify-center cursor-pointer transition-transform ${
                wheelPending ? 'animate-spin' : 'hover:scale-105'
              }`}
              onClick={wheelPending ? undefined : onSpinWheel}
              data-testid="button-spin-wheel"
            >
              <i className="fas fa-play text-2xl text-white"></i>
            </div>
            <Button 
              className="mt-3 bg-game-gold text-game-bg hover:bg-game-amber font-semibold"
              onClick={onSpinWheel}
              disabled={wheelPending}
              data-testid="button-spin-action"
            >
              {wheelPending ? "Spinning..." : "Spin (500 LP)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Chat Quick Panel */}
      <Card className="glass-effect" data-testid="card-ai-chat">
        <CardHeader className="pb-3">
          <CardTitle className="font-orbitron font-bold text-game-cyan flex items-center text-sm">
            <i className="fas fa-comments mr-2"></i>
            Chat with Seraphina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32 mb-3">
            <div className="space-y-2">
              <div className="bg-game-secondary/50 rounded-lg p-2 text-sm" data-testid="chat-message">
                <span className="text-game-cyan font-semibold">Seraphina:</span>
                <span className="text-white ml-1">Hey there! Ready for some fun? 😉</span>
              </div>
            </div>
          </ScrollArea>
          <div className="flex space-x-2">
            <Input 
              placeholder="Type your message..." 
              className="flex-1 bg-game-bg border-game-accent/30 text-white placeholder-gray-400 focus:border-game-accent"
              data-testid="input-chat-message"
            />
            <Button 
              size="sm"
              className="bg-game-accent text-white hover:bg-game-cyan"
              data-testid="button-send-message"
            >
              <i className="fas fa-paper-plane text-sm"></i>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Boosters */}
      <Card className="glass-effect" data-testid="card-quick-boosters">
        <CardHeader className="pb-3">
          <CardTitle className="font-orbitron font-bold text-game-amber flex items-center text-sm">
            <i className="fas fa-rocket mr-2"></i>
            Quick Boosters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline"
              className="bg-game-primary border-game-gold text-game-gold hover:bg-game-gold/20 p-2 h-auto flex flex-col"
              data-testid="button-booster-lp"
            >
              <i className="fas fa-fire text-lg mb-1"></i>
              <div className="text-xs">2x LP</div>
              <div className="text-xs text-gray-400">15m</div>
            </Button>
            <Button 
              variant="outline"
              className="bg-game-primary border-game-cyan text-game-cyan hover:bg-game-cyan/20 p-2 h-auto flex flex-col"
              data-testid="button-booster-energy"
            >
              <i className="fas fa-bolt text-lg mb-1"></i>
              <div className="text-xs">Energy+</div>
              <div className="text-xs text-gray-400">30m</div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
