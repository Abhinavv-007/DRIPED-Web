"use client";

import { motion } from "framer-motion";

interface AnimatedLogoProps {
  size?: number;
  withDrip?: boolean;
  className?: string;
}

export function AnimatedLogo({ size = 40, withDrip = true, className }: AnimatedLogoProps) {
  const shadow = `${Math.max(2, Math.round(size / 12))}px ${Math.max(2, Math.round(size / 12))}px 0px var(--foreground)`;

  return (
    <div
      className={`relative inline-flex ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-label="Driped"
    >
      <motion.div
        animate={{ y: [0, -2, 0] }}
        whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border-2 border-foreground/80 bg-primary"
        style={{ boxShadow: shadow }}
      >
        <motion.span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 bg-white/20"
          animate={{ scaleY: [0.75, 1, 0.75] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "bottom" }}
        />
        <span
          className="relative z-10 font-black tracking-tighter text-primary-foreground"
          style={{ fontSize: size * 0.55 }}
        >
          D
        </span>
      </motion.div>
      {withDrip && (
        <>
          <motion.div
            className="absolute -bottom-1 left-1/2 rounded-full bg-primary"
            style={{ width: size * 0.12, height: size * 0.18, x: "-50%" }}
            animate={{
              y: [0, size * 0.3, size * 0.55],
              opacity: [0, 1, 0],
              scaleY: [0.5, 1, 1.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: "easeIn",
            }}
          />
          <motion.div
            className="absolute rounded-full bg-primary/70"
            style={{
              width: size * 0.08,
              height: size * 0.12,
              left: size * 0.28,
              bottom: size * 0.04,
            }}
            animate={{ y: [0, size * 0.2, size * 0.36], opacity: [0, 0.8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.1, ease: "easeIn" }}
          />
        </>
      )}
    </div>
  );
}
