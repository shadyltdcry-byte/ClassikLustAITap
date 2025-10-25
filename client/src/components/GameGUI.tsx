import React, { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { useAuth } from "../context/AuthContext";
import { Settings } from "lucide-react";
import CharacterDisplay from "./CharacterDisplay";
import CharacterGallery from "./CharacterGallery";
import OfflineIncomeDialog from "./OfflineIncomeDialog";
import AdminMenu from "../plugins/admin/AdminMenu";
import AIChat from "../plugins/aicore/AIChat";
import LevelUp from "../plugins/gameplay/LevelUp";
import Upgrades from "../plugins/gameplay/Upgrades";
import WheelGame from "./wheel/WheelGame";
import VIP from "./vip/VIP";
import { useGameState } from "../hooks/use-game-state";
import { useGame } from "../context/GameProvider";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useQuery } from "@tanstack/react-query";
// Flip panel imports to named where appropriate
import { PlayerStatsPanel } from "./game/PlayerStatsPanel";
import { GameTabsPanel } from "./game/GameTabsPanel";
import FloatingActionIcons from "./ui/FloatingActionIcons";
import { GameProgressPanel } from "./game/GameProgressPanel";
import TasksPanel from "./game/TasksPanel";
import AchievementsPanel from "./game/AchievementsPanel";
import { EnhancedDebugger } from "./debug";

interface PlayerData {
  id: string;
  name: string;
  level: number;
  lp: number;
  lpPerHour: number;
  lpPerTap: number;
  energy: number;
  maxEnergy: number;
  coins: number;
  lustGems?: number;
  xp: number;
  xpToNext: number;
  avatar?: string;
  activeBoosters?: Array<{ name: string }>;
  isVip?: boolean;
  [key: string]: any;
}

interface GameGUIProps {
  playerData?: PlayerData;
  onPluginAction: (action: string, data?: any) => void;
  onPluginChange?: (plugin: string) => void;
}

interface GUIState {
  activePlugin: string;
  showAdminMenu: boolean;
  showCharacterGallery: boolean;
  showWheelGame: boolean;
  showVIP: boolean;
}

export default function GameGUI({ playerData, onPluginAction }: GameGUIProps) {
  // ... rest of file unchanged ...
}
