"use client";

import { useEffect, useTransition } from "react";
import { markModuleStarted } from "@/lib/actions";

export function ModuleProgressTracker({
  moduleId,
  status,
}: {
  moduleId: string;
  status: string;
}) {
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (status === "NOT_STARTED") {
      startTransition(async () => {
        await markModuleStarted(moduleId);
      });
    }
    // Only run once on mount for a freshly-loaded module.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
