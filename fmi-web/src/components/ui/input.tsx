import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-neutral-200 bg-white/80 px-4 py-2 text-sm text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-100 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-emerald-800",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
