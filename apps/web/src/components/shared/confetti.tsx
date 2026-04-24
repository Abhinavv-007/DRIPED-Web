"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

const COLORS = ["#E8A87C", "#FF6B6B", "#4ECDC4", "#FFD93D", "#95E1D3", "#F38181", "#A8E6CF", "#C7B9FF"];

export interface ConfettiPiece {
  id: number;
  x: number;
  endX: number;
  color: string;
  shape: "square" | "circle" | "triangle";
  delay: number;
  duration: number;
  rotate: number;
  size: number;
}

interface ConfettiProps {
  pieces: ConfettiPiece[];
  onDone?: () => void;
}

export function createConfettiPieces(count = 44): ConfettiPiece[] {
  const seed = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const x = Math.random() * 100;
    return {
      id: seed + i,
      x,
      endX: x + (Math.random() - 0.5) * 30,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: (["square", "circle", "triangle"] as const)[Math.floor(Math.random() * 3)],
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 0.8,
      rotate: Math.random() > 0.5 ? 720 : -720,
      size: 10 + Math.random() * 8,
    };
  });
}

export function Confetti({ pieces, onDone }: ConfettiProps) {
  useEffect(() => {
    if (pieces.length === 0) return;
    const timer = setTimeout(() => {
      onDone?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, [pieces.length, onDone]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: "-10vh",
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: "110vh",
            rotate: p.rotate,
            x: `${p.endX}vw`,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
          className="absolute"
          style={{ top: 0, left: 0 }}
        >
          <div
            className={`border-2 border-foreground/50 ${
              p.shape === "circle" ? "rounded-full" : p.shape === "triangle" ? "triangle-shape" : ""
            }`}
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: "1px 1px 0px rgba(0,0,0,0.4)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
