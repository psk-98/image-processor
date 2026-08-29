import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full resize-y rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
