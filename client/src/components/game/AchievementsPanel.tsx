import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAchievementsByCategory } from "@/plugins/gameplay/Achievements";

export interface AchievementsPanelProps {
  claimingRewards: Set<string>;
  onClaimReward: (id: string, type: string) => void;
}

export function AchievementsPanel({ claimingRewards, onClaimReward }: AchievementsPanelProps) {
  return <div className="hidden" />;
}

export default AchievementsPanel;
