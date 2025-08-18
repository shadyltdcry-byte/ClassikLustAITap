import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLP: (amount: number) => void;
  onMaxEnergy: () => void;
}

export function AdminPanel({ isOpen, onClose, onAddLP, onMaxEnergy }: AdminPanelProps) {
  if (!isOpen) return null;

  return (
    <Card className="fixed top-4 right-4 w-80 glass-effect shadow-2xl z-50" data-testid="admin-panel">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="font-orbitron font-bold text-red-400">Admin Panel</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-red-400 hover:text-red-300 p-1"
            data-testid="button-close-admin"
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              className="bg-red-600/20 border border-red-400 text-red-400 hover:bg-red-600/40"
              onClick={() => onAddLP(10000)}
              data-testid="button-add-lp"
            >
              Add 10K LP
            </Button>
            <Button 
              className="bg-red-600/20 border border-red-400 text-red-400 hover:bg-red-600/40"
              onClick={onMaxEnergy}
              data-testid="button-max-energy"
            >
              Max Energy
            </Button>
            <Button 
              className="bg-red-600/20 border border-red-400 text-red-400 hover:bg-red-600/40"
              onClick={() => onAddLP(100000)}
              data-testid="button-unlock-all"
            >
              Add 100K LP
            </Button>
            <Button 
              className="bg-red-600/20 border border-red-400 text-red-400 hover:bg-red-600/40"
              disabled
              data-testid="button-reset-game"
            >
              Reset Game
            </Button>
          </div>
          <div className="border-t border-red-400/30 pt-3">
            <label className="block text-sm text-red-400 mb-1">Debug Mode:</label>
            <Select defaultValue="off">
              <SelectTrigger className="w-full bg-game-bg border-red-400/30 text-red-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="console">Console Logs</SelectItem>
                <SelectItem value="visual">Visual Indicators</SelectItem>
                <SelectItem value="full">Full Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
