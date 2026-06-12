"use client";

import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export function Dropdown(props: React.ComponentProps<typeof DropdownPrimitive.Root>) {
  return <DropdownPrimitive.Root dir="rtl" {...props} />;
}
export const DropdownTrigger = DropdownPrimitive.Trigger;

export function DropdownContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={6}
        align="end"
        className={cn(
          "z-50 min-w-44 rounded-xl border border-line bg-surface p-1 shadow-pop fade-up",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-ink-2 outline-none transition-colors data-[highlighted]:bg-inset data-[highlighted]:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownSeparator() {
  return <DropdownPrimitive.Separator className="my-1 h-px bg-line" />;
}
