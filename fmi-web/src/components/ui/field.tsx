import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-end justify-between gap-4">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <span className="text-xs text-neutral-400">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
