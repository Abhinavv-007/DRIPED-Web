"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Pencil } from "lucide-react";
import { useCreateSubscription } from "@/lib/hooks/use-subscriptions";
import { useAppStore } from "@/lib/stores/app-store";
import { toast } from "sonner";
import { POPULAR_SERVICES, SERVICE_CATEGORIES, type ServiceInfo } from "@/lib/constants/services";
import { ServiceAvatar } from "@/components/shared/service-avatar";
import { CategoryIcon } from "@/components/shared/category-icon";
import type { SubscriptionCreateBody, BillingCycle, SubscriptionStatus } from "@/lib/models/types";

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "lifetime", label: "Lifetime" },
];

const STATUSES: { value: SubscriptionStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = "pick" | "form";

export function AddSubscriptionModal({ open, onOpenChange, onSuccess }: Props) {
  const currency = useAppStore((s) => s.preferredCurrency);
  const createSub = useCreateSubscription();
  const [step, setStep] = useState<Step>("pick");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

  const [form, setForm] = useState({
    service_name: "",
    service_slug: "",
    amount: "",
    billing_cycle: "monthly" as BillingCycle,
    status: "active" as SubscriptionStatus,
    start_date: "",
    next_renewal_date: "",
  });

  const filteredServices = useMemo(() => {
    let list = POPULAR_SERVICES;
    if (catFilter !== "all") {
      list = list.filter((s) => s.category === catFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.slug.includes(q));
    }
    return list;
  }, [search, catFilter]);

  const selectService = (svc: ServiceInfo) => {
    setForm({
      service_name: svc.name,
      service_slug: svc.slug,
      amount: svc.defaultAmount ? String(svc.defaultAmount) : "",
      billing_cycle: (svc.defaultCycle as BillingCycle) ?? "monthly",
      status: "active",
      start_date: new Date().toISOString().slice(0, 10),
      next_renewal_date: "",
    });
    setStep("form");
  };

  const goCustom = () => {
    setForm({
      service_name: search,
      service_slug: "",
      amount: "",
      billing_cycle: "monthly",
      status: "active",
      start_date: new Date().toISOString().slice(0, 10),
      next_renewal_date: "",
    });
    setStep("form");
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service_name.trim() || !form.amount) {
      toast.error("Service name and amount are required");
      return;
    }
    const slug = form.service_slug || form.service_name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const body: SubscriptionCreateBody = {
      service_name: form.service_name.trim(),
      service_slug: slug,
      amount: parseFloat(form.amount),
      billing_cycle: form.billing_cycle,
      currency,
      status: form.status,
      start_date: form.start_date || undefined,
      next_renewal_date: form.next_renewal_date || undefined,
      source: "manual",
      is_trial: form.status === "trial",
    };
    try {
      await createSub.mutateAsync(body);
      toast.success(`${form.service_name} added!`);
      onSuccess?.();
      onOpenChange(false);
      resetAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  };

  const resetAll = () => {
    setStep("pick");
    setSearch("");
    setCatFilter("all");
    setForm({ service_name: "", service_slug: "", amount: "", billing_cycle: "monthly", status: "active", start_date: "", next_renewal_date: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetAll(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl border-2 border-foreground/80" style={{ boxShadow: "6px 6px 0px var(--foreground)" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            {step === "form" && (
              <button onClick={() => setStep("pick")} className="rounded-lg p-1 hover:bg-muted transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {step === "pick" ? "Pick a subscription" : `Add ${form.service_name}`}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "pick" ? (
            <motion.div key="pick" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="brutal-input w-full pl-9"
                  autoFocus
                />
              </div>

              {/* Category pills */}
              <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setCatFilter("all")}
                  className={`brutal-pill whitespace-nowrap text-[10px] ${catFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card"}`}
                >
                  All
                </button>
                {SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setCatFilter(catFilter === cat.slug ? "all" : cat.slug)}
                    className={`brutal-pill whitespace-nowrap text-[10px] ${catFilter === cat.slug ? "bg-primary text-primary-foreground" : "bg-card"}`}
                  >
                    <CategoryIcon iconName={cat.iconName} className="size-3" size={12} />
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Service grid */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {filteredServices.map((svc, i) => (
                  <motion.button
                    key={svc.slug}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => selectService(svc)}
                    className="brutal-card-flat flex flex-col items-center gap-2 p-3 hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    <ServiceAvatar serviceSlug={svc.slug} serviceName={svc.name} size={36} />
                    <span className="text-[11px] font-bold leading-tight text-center truncate w-full">{svc.name}</span>
                  </motion.button>
                ))}
              </div>

              {filteredServices.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">No service found</p>
                </div>
              )}

              {/* Custom entry */}
              <button
                onClick={goCustom}
                className="brutal-btn mt-3 flex w-full items-center justify-center gap-2 bg-secondary px-4 py-3 text-sm"
              >
                <Pencil className="h-4 w-4" /> Add custom subscription
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Service name (pre-filled or editable) */}
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <ServiceAvatar serviceSlug={form.service_slug} serviceName={form.service_name} size={44} />
                  <div className="min-w-0 flex-1">
                    <input
                      value={form.service_name}
                      onChange={(e) => update("service_name", e.target.value)}
                      className="w-full bg-transparent text-lg font-black outline-none"
                      placeholder="Service name"
                    />
                  </div>
                </div>

                {/* Amount + Cycle */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase tracking-wider">Amount *</Label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => update("amount", e.target.value)}
                      className="brutal-input w-full"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase tracking-wider">Cycle</Label>
                    <select
                      value={form.billing_cycle}
                      onChange={(e) => update("billing_cycle", e.target.value)}
                      className="brutal-input w-full"
                    >
                      {BILLING_CYCLES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status chips */}
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs uppercase tracking-wider">Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => update("status", s.value)}
                        className={`brutal-pill text-[10px] transition-all ${
                          form.status === s.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card hover:bg-muted"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase tracking-wider">Start</Label>
                    <input type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} className="brutal-input w-full" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase tracking-wider">Next Renewal</Label>
                    <input type="date" value={form.next_renewal_date} onChange={(e) => update("next_renewal_date", e.target.value)} className="brutal-input w-full" />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setStep("pick")} className="flex-1 brutal-btn bg-card">
                    Back
                  </Button>
                  <Button type="submit" disabled={createSub.isPending} className="flex-1 brutal-btn bg-primary text-primary-foreground">
                    {createSub.isPending ? "Adding..." : "Add Subscription"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
