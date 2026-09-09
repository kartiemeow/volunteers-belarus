"use client";

import { useActionState, type ReactNode } from "react";
import { FormMessage } from "@/components/ui";
import type { ActionResult } from "@/lib/action-result";

export function ActionForm({ action, children, className = "" }: {
  action: (state: ActionResult, data: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      <fieldset disabled={pending} className="flex flex-wrap items-center gap-2 disabled:opacity-60">
        {children}
      </fieldset>
      <div role="status" aria-live="polite"><FormMessage state={state} /></div>
    </form>
  );
}
