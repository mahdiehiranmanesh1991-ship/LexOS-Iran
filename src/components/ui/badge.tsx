import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.7rem] font-medium leading-5 whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-line bg-raised text-ink-2",
        accent: "border-accent-line bg-accent-soft text-accent-strong",
        danger: "border-danger-line bg-danger-soft text-danger",
        warn: "border-warn-line bg-warn-soft text-warn",
        info: "border-info-line bg-info-soft text-info",
        ok: "border-accent-line bg-ok-soft text-ok",
        solid: "border-transparent bg-ink text-white",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
