"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getServiceInfo } from "@/lib/constants/services";

interface ServiceAvatarProps {
  serviceSlug: string;
  serviceName: string;
  size?: number;
  className?: string;
}

/**
 * ServiceAvatar renders a brand logo tile that works in both light and dark
 * modes. It is theme-aware via `--logo-bg` (white in light, cream in dark)
 * and adds a soft rim-light in dark mode so white-on-white doesn't vanish.
 * Never shows a "ghost" placeholder — falls back to coloured initials.
 */
export function ServiceAvatar({
  serviceSlug,
  serviceName,
  size = 40,
  className,
}: ServiceAvatarProps) {
  const info =
    (serviceSlug ? getServiceInfo(serviceSlug) : undefined) ??
    (serviceName ? getServiceInfo(serviceName) : undefined);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const displayName = info?.name ?? serviceName ?? "?";
  const bgColor = info?.color ?? generateColor(displayName);
  const hasLogo = Boolean(info?.logo && failedLogo !== info.logo);

  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  // When we have a brand logo we use the theme-aware neutral tile so the logo
  // (often white or dark) stays visible. When we fall back to initials we use
  // the brand colour so the tile still reads as "this service".
  const tileBg = hasLogo ? "var(--logo-bg)" : bgColor;
  const rim = hasLogo
    ? "inset 0 0 0 1px var(--logo-rim)"
    : "inset 0 0 0 1px color-mix(in srgb, #000 25%, transparent)";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl font-black shrink-0 border-2 overflow-hidden",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: tileBg,
        borderColor: "var(--neo-ink)",
        fontSize: size * 0.34,
        boxShadow: `2px 2px 0px var(--neo-ink), ${rim}`,
      }}
      aria-label={displayName}
    >
      {hasLogo ? (
        <Image
          src={info!.logo}
          alt={displayName}
          width={Math.round(size * 0.6)}
          height={Math.round(size * 0.6)}
          className="object-contain"
          onError={() => setFailedLogo(info?.logo ?? null)}
          unoptimized
        />
      ) : (
        <span className="text-white drop-shadow-sm">{initials}</span>
      )}
    </div>
  );
}

function generateColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
}
