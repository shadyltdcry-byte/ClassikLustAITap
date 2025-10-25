/**
 * PlayerStatsPanel.tsx - Game Stats with NEW MENU SYSTEM INTEGRATION!
 */

import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Zap, Heart, Gem, Sparkles } from "lucide-react";
import { MenuProvider, useMenu, MENU_IDS } from "@/components/menu/MenuProvider";
import { MenuHost } from "@/components/menu/MenuHost";
import { initializeMenuRegistry } from "@/components/menu/MenuRegistry";
import { toast } from "react-hot-toast";

export interface PlayerStatsPanelProps {
  user?: any;
  playerData?: any;
  selectedCharacter?: any;
  onAvatarClick: () => void;
  onOpenGallery: () => void;
}

function NewMenuButtons() {
  const { open, isOpen, close } = useMenu();
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    const refresh = async () => {
      try {
        const r = await fetch('/api/player/5134006535/stats');
        const j = await r.json();
        if (j.success) setStats(j.data);
      } catch {}
    };
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden" />
  );
}

function PlayerStatsPanelCore({ user, playerData, selectedCharacter, onAvatarClick, onOpenGallery }: PlayerStatsPanelProps) {
  return (<div className="hidden" />);
}

export function PlayerStatsPanel(props: PlayerStatsPanelProps) {
  useEffect(() => {
    try { initializeMenuRegistry(); } catch {}
  }, []);
  return (
    <MenuProvider>
      <PlayerStatsPanelCore {...props} />
      <NewMenuButtons />
      <MenuHost />
    </MenuProvider>
  );
}

export default PlayerStatsPanel;
