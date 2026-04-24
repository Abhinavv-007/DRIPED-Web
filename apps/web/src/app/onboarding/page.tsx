"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, ScanSearch, BarChart3, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";

const slides = [
  {
    icon: Droplets,
    title: "Your money is\ndripping away.",
    subtitle:
      "Every forgotten trial. Every silent renewal.\nLittle drops that add up to thousands.",
    color: "text-[#448AFF]",
    bg: "bg-[#D0E8FF]",
  },
  {
    icon: ScanSearch,
    title: "We find every\ncharge. Automatically.",
    subtitle:
      "Driped scans your Gmail for subscription receipts.\nNothing leaves your device.",
    color: "text-[#00C853]",
    bg: "bg-[#D0FFE0]",
  },
  {
    icon: BarChart3,
    title: "Take back\ncontrol.",
    subtitle:
      "Track spend, get renewal alerts, cancel what you\ndon't use. See exactly where your money goes.",
    color: "text-primary",
    bg: "bg-[#FFF0DB]",
  },
];

export default function OnboardingPage() {
  const [page, setPage] = useState(0);
  const router = useRouter();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const finish = () => {
    setOnboardingComplete(true);
    router.push("/connect");
  };

  const next = () => {
    if (page < slides.length - 1) setPage(page + 1);
    else finish();
  };

  const current = slides[page];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, currentColor 20px, currentColor 21px)' }} />

      {/* Skip */}
      {page < slides.length - 1 && (
        <button
          onClick={finish}
          className="absolute right-6 top-8 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex max-w-lg flex-col items-center text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className={`mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border-3 border-foreground/80 ${current.bg}`}
            style={{ boxShadow: '6px 6px 0px var(--foreground)' }}
          >
            <current.icon className={`h-12 w-12 ${current.color}`} strokeWidth={1.5} />
          </motion.div>

          {/* Title */}
          <h1 className="whitespace-pre-line text-4xl font-black leading-tight tracking-tight text-foreground md:text-5xl">
            {current.title}
          </h1>

          {/* Subtitle */}
          <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground md:text-lg">
            {current.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Bottom controls */}
      <div className="absolute bottom-12 flex flex-col items-center gap-6">
        {/* Dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === page
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={next}
          className="brutal-btn group h-14 min-w-[200px] bg-primary px-8 text-base text-primary-foreground"
        >
          {page === slides.length - 1 ? "Get Started" : "Next"}
          {page === slides.length - 1 ? (
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          ) : (
            <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
          )}
        </Button>
      </div>
    </div>
  );
}
