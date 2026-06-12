"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { updateCaseStateAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { CASE_STAGE_FA, CASE_STATUS_FA } from "@/lib/domain/taxonomies";
import type { CaseStage, CaseStatus } from "@/lib/domain/types";

export function CaseStateMenu({
  caseId,
  stage,
  status,
}: {
  caseId: string;
  stage: CaseStage;
  status: CaseStatus;
}) {
  const [pending, startTransition] = useTransition();

  function update(patch: { stage?: CaseStage; status?: CaseStatus }) {
    startTransition(async () => {
      await updateCaseStateAction(caseId, patch);
      toast.success("وضعیت پرونده به‌روزرسانی شد");
    });
  }

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button size="sm" disabled={pending} className="gap-1">
          تغییر مرحله / وضعیت <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownTrigger>
      <DropdownContent className="w-56">
        <p className="px-2.5 pb-1 pt-1.5 text-[0.6rem] font-bold text-faint">مرحله دادرسی</p>
        {(Object.entries(CASE_STAGE_FA) as [CaseStage, string][]).map(([v, l]) => (
          <DropdownItem key={v} onSelect={() => update({ stage: v })} className={v === stage ? "bg-accent-soft text-accent-strong" : ""}>
            {l}
          </DropdownItem>
        ))}
        <DropdownSeparator />
        <p className="px-2.5 pb-1 pt-1.5 text-[0.6rem] font-bold text-faint">وضعیت</p>
        {(Object.entries(CASE_STATUS_FA) as [CaseStatus, string][]).map(([v, l]) => (
          <DropdownItem key={v} onSelect={() => update({ status: v })} className={v === status ? "bg-accent-soft text-accent-strong" : ""}>
            {l}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
