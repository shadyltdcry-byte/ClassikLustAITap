import React from "react";

export interface GameProgressPanelProps {
  type: 'tasks' | 'achievements';
  progress: number;
}

export function GameProgressPanel({ type, progress }: GameProgressPanelProps) {
  return <div className="hidden" />;
}

export default GameProgressPanel;
