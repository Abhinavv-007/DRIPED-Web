"use client";

import {
  Tv,
  Music,
  Briefcase,
  BookOpen,
  Heart,
  TrendingUp,
  ShoppingBag,
  Code2,
  Zap,
  Gamepad2,
  Newspaper,
  Grid2x2,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  tv: Tv,
  music: Music,
  briefcase: Briefcase,
  "book-open": BookOpen,
  heart: Heart,
  "trending-up": TrendingUp,
  "shopping-bag": ShoppingBag,
  "code-2": Code2,
  zap: Zap,
  "gamepad-2": Gamepad2,
  newspaper: Newspaper,
  "grid-2x2": Grid2x2,
  grid: Grid2x2,
};

export function CategoryIcon({
  iconName,
  className,
  size = 16,
}: {
  iconName: string;
  className?: string;
  size?: number;
}) {
  const Icon = ICON_MAP[iconName] ?? Grid2x2;
  return <Icon className={className} size={size} />;
}
