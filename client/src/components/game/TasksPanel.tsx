import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTasksByCategory } from "@/plugins/gameplay/Task";
import { getAchievementsByCategory } from "@/plugins/gameplay/Achievements";

export interface TasksPanelProps {
  claimingRewards: Set<string>;
  onClaimReward: (id: string, type: string) => void;
}

export function TasksPanel({ claimingRewards, onClaimReward }: TasksPanelProps) {
  return <div className="hidden" />;
}

export default TasksPanel;
