import React from "react";
import { Button } from "@/components/ui/button";
import { Activity, Crown, Settings, Image } from "lucide-react";

export interface FloatingActionIconsProps {
  onOpenWheel: () => void;
  onOpenVIP: () => void;
  onOpenAdmin: () => void;
  onOpenGallery: () => void;
}

export function FloatingActionIcons({ onOpenWheel, onOpenVIP, onOpenAdmin, onOpenGallery }: FloatingActionIconsProps) {
  return <div className="hidden" />;
}

export default FloatingActionIcons;
