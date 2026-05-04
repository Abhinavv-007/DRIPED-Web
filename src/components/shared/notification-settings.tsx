"use client";

import {
  BellRing,
  BellOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePush } from "@/lib/hooks/use-push";

/**
 * Drop into any page (e.g., profile) to let the user enable/disable
 * browser push notifications for renewal reminders + monthly summary.
 *
 * States handled explicitly: unsupported, default (not requested yet),
 * requesting/loading, granted+subscribed, granted-but-not-subscribed
 * (rare — e.g. server rejected), denied, error.
 */
export function NotificationSettings() {
  const { state, enable, disable } = usePush();

  const statusDot = state.subscribed
    ? "bg-[color:var(--success)]"
    : state.permission === "denied"
      ? "bg-[color:var(--danger)]"
      : state.error
        ? "bg-[color:var(--warning)]"
        : "bg-[color:var(--neo-ink-ghost)]";

  const statusLabel = !state.supported
    ? "Unsupported"
    : state.subscribed
      ? "Enabled"
      : state.permission === "denied"
        ? "Blocked"
        : state.loading
          ? "Enabling…"
          : "Not enabled";

  return (
    <section className="brutal-card space-y-4 p-5">
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2"
          style={{
            background: "var(--neo-lilac)",
            borderColor: "var(--neo-ink)",
            boxShadow: "3px 3px 0 var(--neo-ink)",
            color: "var(--neo-ink)",
          }}
        >
          <BellRing className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-base font-black text-foreground">
              Browser notifications
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border border-foreground/30 bg-card px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-foreground`}
            >
              <span className={`size-2 rounded-full ${statusDot}`} />
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground/70">
            Get pinged 7, 3, and 1 day before renewals — plus a monthly summary on the 1st.
          </p>
        </div>
      </div>

      {!state.supported && (
        <div className="brutal-card-flat flex items-start gap-2 p-3 text-sm text-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[color:var(--warning)]" />
          <span>
            This browser doesn&apos;t support Web Push. Try Chrome, Firefox, or Safari 16+.
          </span>
        </div>
      )}

      {state.error && (
        <div className="brutal-card-flat flex items-start gap-2 p-3 text-sm text-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[color:var(--danger)]" />
          <span>{state.error}</span>
        </div>
      )}

      {state.supported && (
        <div className="flex flex-wrap items-center gap-2">
          {state.subscribed ? (
            <>
              <span
                className="brutal-badge"
                style={{ background: "var(--neo-mint)", color: "var(--neo-ink)" }}
              >
                <CheckCircle2 className="mr-1 size-3" /> Enabled
              </span>
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={state.loading}
                onClick={disable}
              >
                <BellOff className="mr-2 size-4" /> Turn off on this device
              </Button>
            </>
          ) : state.permission === "denied" ? (
            <div className="flex w-full flex-col gap-2">
              <p className="text-sm text-foreground/80">
                Notifications are blocked for this site.
              </p>
              <ol className="list-decimal space-y-1 pl-5 text-xs text-foreground/70">
                <li>Click the lock icon in your address bar.</li>
                <li>Find &ldquo;Notifications&rdquo; and switch to Allow.</li>
                <li>Reload this page and hit &ldquo;Enable&rdquo; again.</li>
              </ol>
            </div>
          ) : state.error ? (
            <Button className="rounded-xl" onClick={enable} disabled={state.loading}>
              {state.loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Retrying…
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 size-4" /> Try again
                </>
              )}
            </Button>
          ) : (
            <Button className="rounded-xl" onClick={enable} disabled={state.loading}>
              {state.loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Enabling…
                </>
              ) : (
                <>
                  <BellRing className="mr-2 size-4" /> Enable notifications
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
