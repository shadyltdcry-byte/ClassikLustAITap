import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import WheelGame from "./WheelGame";

interface WheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const WHEEL_SEGMENTS = [
  { label: "+1000 coins", color: "#FF6B6B", icon: "💰", weight: 25 },
  { label: "gems", color: "#4ECDC4", icon: "💎", weight: 15 },
  { label: "+10 coins", color: "#45B7D1", icon: "🪙", weight: 30 },
  { label: "+500 coins", color: "#96CEB4", icon: "💰", weight: 20 },
  { label: "Character unlock", color: "#FFEAA7", icon: "👤", weight: 5 },
  { label: "+500 coins", color: "#DDA0DD", icon: "💰", weight: 20 },
  { label: "gems", color: "#FFB347", icon: "💎", weight: 15 },
  { label: "+10 coins", color: "#F8BBD9", icon: "🪙", weight: 30 }
];

export default function WheelModal({ isOpen, onClose, userId }: WheelModalProps) {
  // Use the new WheelGame component for better UX
  return <WheelGame isOpen={isOpen} onClose={onClose} userId={userId} />;
}