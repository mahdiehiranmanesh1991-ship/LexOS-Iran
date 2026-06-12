"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { setDeadlineStatusAction } from "@/app/actions";
import { DueBadge } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEADLINE_STATUS_FA } from "@/lib/domain/taxonomies";
import type { Deadline } from "@/lib/domain/types";
import { formatJalaliNumeric } from "@/lib/jalali";
import { cn } from "@/lib/utils";

export function DeadlineRow({ deadline: d, showCase }: { deadline: Deadline; showCase?: boolean }) {
  const [pending, startTransition] = useTransition();

  function set(status: Deadline["status"], msg: string) {
    startTransition(async () => {
      await setDeadlineStatusAction(d.id, status);
      toast.success(msg);
    });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3 px-4 py-3", pending && "opacity-50", d.status !== "open" && "opacity-70")}>
      {d.status === "open" ? (
        <DueBadge dueAt={d.due_at} />
      ) : (
        <Badge tone={d.status === "done" ? "ok" : d.status === "missed" ? "danger" : "neutral"}>
          {DEADLINE_STATUS_FA[d.status]}
        </Badge>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("text-[0.78rem] font-bold text-ink", d.status === "done" && "line-through decoration-line-2")}>
          {d.title}
        </p>
        <p className="mt-0.5 text-[0.64rem] leading-5 text-muted">
          سررسید {formatJalaliNumeric(d.due_at)}
          {d.trigger_date ? ` · مبدأ ${formatJalaliNumeric(d.trigger_date)}` : ""}
          {d.citation ? ` · ${d.citation}` : ""}
          {showCase && d.case ? (
            <>
              {" · "}
              <Link href={`/cases/${d.case.id}`} className="text-accent hover:underline">
                {d.case.title}
              </Link>
            </>
          ) : null}
        </p>
        {d.notes && <p className="mt-0.5 text-[0.62rem] text-faint">{d.notes}</p>}
      </div>
      {d.created_by === "agent" && <Badge tone="accent">AI</Badge>}
      {d.status === "open" && (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="gap-1 text-ok" onClick={() => set("done", "موعد انجام شد")}>
            <Check className="h-3.5 w-3.5" /> انجام شد
          </Button>
          <Button size="sm" variant="ghost" className="gap-1 text-muted" onClick={() => set("cancelled", "موعد لغو شد")}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
