"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Plus, ScanSearch, X, Command as CommandIcon } from "lucide-react";

export function MobileFab() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const actions = [
    {
      icon: Plus,
      label: "Add sub",
      color: "bg-primary text-primary-foreground",
      onClick: () => router.push("/subscriptions?add=true"),
    },
    {
      icon: ScanSearch,
      label: "Scan",
      color: "bg-[#D0E8FF] text-[#003D80]",
      onClick: () => router.push("/profile#scan"),
    },
    {
      icon: CommandIcon,
      label: "Cmd",
      color: "bg-[#FFF3D0] text-[#7A5C00]",
      onClick: () => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true })
        );
      },
    },
  ];

  return (
    <>
      {/* Backdrop when open */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 md:hidden">
        <AnimatePresence>
          {open &&
            actions.map((a, i) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  setOpen(false);
                  a.onClick();
                }}
                aria-label={a.label}
                className={`flex items-center gap-2 rounded-full border-2 border-foreground/80 px-4 py-2.5 text-xs font-black ${a.color}`}
                style={{ boxShadow: "3px 3px 0px var(--foreground)" }}
              >
                <a.icon className="h-4 w-4" />
                {a.label}
              </motion.button>
            ))}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-foreground/80 bg-primary text-primary-foreground"
          style={{ boxShadow: "4px 4px 0px var(--foreground)" }}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.button>
      </div>
    </>
  );
}
