import type { AppCategory } from "@/lib/models/types";

export interface CategoryConfig {
  slug: string;
  name: string;
  colourHex: string;
  iconName: string;
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { slug: "entertainment", name: "Entertainment", colourHex: "#BF5AF2", iconName: "tv" },
  { slug: "music", name: "Music", colourHex: "#FF375F", iconName: "music" },
  { slug: "productivity", name: "Productivity", colourHex: "#0A84FF", iconName: "briefcase" },
  { slug: "education", name: "Education", colourHex: "#30D158", iconName: "book-open" },
  { slug: "health_fitness", name: "Health", colourHex: "#FF6B6B", iconName: "heart" },
  { slug: "finance", name: "Finance", colourHex: "#FFD60A", iconName: "trending-up" },
  { slug: "shopping", name: "Shopping", colourHex: "#FF9F0A", iconName: "shopping-bag" },
  { slug: "development", name: "Development", colourHex: "#64D2FF", iconName: "code-2" },
  { slug: "utilities", name: "Utilities", colourHex: "#8E8E93", iconName: "zap" },
  { slug: "gaming", name: "Gaming", colourHex: "#32D74B", iconName: "gamepad-2" },
  { slug: "news", name: "News", colourHex: "#AC8E68", iconName: "newspaper" },
  { slug: "other", name: "Other", colourHex: "#636366", iconName: "grid-2x2" },
];

export const DEFAULT_CATEGORIES: AppCategory[] = CATEGORY_CONFIGS.map((c) => ({
  id: `cat_${c.slug}`,
  user_id: "",
  name: c.name,
  slug: c.slug,
  colour_hex: c.colourHex,
  icon_name: c.iconName,
  budget_limit: null,
  is_default: 1,
}));

export function getCategoryConfig(slug: string): CategoryConfig {
  return CATEGORY_CONFIGS.find((c) => c.slug === slug) ?? CATEGORY_CONFIGS[CATEGORY_CONFIGS.length - 1];
}
