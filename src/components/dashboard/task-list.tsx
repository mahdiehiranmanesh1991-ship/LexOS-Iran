"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toggleTaskAction } from "@/app/actions";
import type { Task } from "@/lib/domain/types";
import { relativeDayFa } from "@/lib/jalali";
import { cn } from "@/lib/utils";

export function TaskList({ tasks }: { tasks: Task[] }) {
  const [pending, startTransition] = useTransition();
  if (tasks.length === 0) {
    return <div className="card px-4 py-6 text-center text-xs text-muted">کار باز ندارید 🎉</div>;
  }
  return (
    <div className={cn("card divide-y divide-line", pending && "opacity-60")}>
      {tasks.slice(0, 6).map((t) => (
        <button
          key={t.id}
          onClick={() => startTransition(() => toggleTaskAction(t.id))}
          className="group flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start transition-colors hover:bg-raised"
        >
          <span
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors",
              t.priority === "critical"
                ? "border-danger-line group-hover:border-danger"
                : "border-line-2 group-hover:border-accent",
            )}
          >
            <Check className="h-3 w-3 text-transparent group-hover:text-accent/50" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.75rem] text-ink">{t.title}</span>
            <span className="mt-0.5 block truncate text-[0.62rem] text-muted">
              {t.case?.title ?? "عمومی"}
              {t.due_on ? ` · ${relativeDayFa(t.due_on)}` : ""}
            </span>
          </span>
          {t.priority === "critical" && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
          )}
        </button>
      ))}
    </div>
  );
}
