"use client";

import { useCallback, useEffect, useState } from "react";
import {
  enablePush,
  disablePush,
  getPermissionState,
  isCurrentlySubscribed,
  isPushSupported,
  type PushPermission,
} from "@/lib/push/web-push";

export interface UsePushState {
  supported: boolean;
  permission: PushPermission;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

export function usePush(): {
  state: UsePushState;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<UsePushState>({
    supported: true,            // optimistic until mounted
    permission: "default",
    subscribed: false,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    const supported = isPushSupported();
    if (!supported) {
      setState({ supported: false, permission: "unsupported", subscribed: false, loading: false, error: null });
      return;
    }
    const permission = getPermissionState();
    let subscribed = false;
    try {
      subscribed = await Promise.race([
        isCurrentlySubscribed(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error("Push check timed out")), 6_000)
        ),
      ]);
    } catch {
      subscribed = false;
    }
    setState({ supported: true, permission, subscribed, loading: false, error: null });
  }, []);

  useEffect(() => {
    const id = setTimeout(() => refresh(), 0);
    return () => clearTimeout(id);
  }, [refresh]);

  const enable = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const result = await enablePush();
    if (!result.ok) {
      setState((s) => ({ ...s, loading: false, error: result.error ?? "Enable failed" }));
      return;
    }
    await refresh();
  }, [refresh]);

  const disable = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const result = await disablePush();
    if (!result.ok) {
      setState((s) => ({ ...s, loading: false, error: result.error ?? "Disable failed" }));
      return;
    }
    await refresh();
  }, [refresh]);

  return { state, enable, disable, refresh };
}
