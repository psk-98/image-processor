import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-500 text-emerald-950 shadow-[0_10px_30px_-12px_rgba(16,185,129,.9)] hover:bg-emerald-400 hover:-translate-y-0.5",
        dark: "bg-neutral-950 text-white hover:bg-neutral-800 hover:-translate-y-0.5",
        outline:
          "border border-neutral-200 bg-white/70 text-neutral-900 hover:border-emerald-300 hover:bg-emerald-50",
        ghost: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
        destructive: "bg-red-600 text-white hover:bg-red-500",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-7 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const classes = cn(buttonVariants({ variant, size, className }));
  const Component = (asChild ? Slot : "button") as React.ElementType;

  return <Component className={classes} {...props} />;
}

export { Button, buttonVariants };
