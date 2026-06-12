import Link from "next/link";
import { Users } from "lucide-react";
import { ContactFormDialog } from "@/components/contacts/contact-form";
import { EmptyState, PageHeader } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { getDataSource } from "@/lib/data";
import { CONTACT_KIND_FA } from "@/lib/domain/taxonomies";
import type { ContactKind } from "@/lib/domain/types";
import { faNum } from "@/lib/jalali";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_TONE: Record<ContactKind, "accent" | "danger" | "info" | "warn" | "neutral" | "ok"> = {
  client: "accent",
  opponent: "danger",
  opposing_counsel: "warn",
  judge: "info",
  expert: "ok",
  other: "neutral",
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDataSource();
  let contacts = await db.listContacts();

  const counts = contacts.reduce<Record<string, number>>((acc, c) => {
    acc[c.kind] = (acc[c.kind] ?? 0) + 1;
    return acc;
  }, {});

  if (sp.kind) contacts = contacts.filter((c) => c.kind === sp.kind);
  if (sp.q) {
    const q = sp.q;
    contacts = contacts.filter(
      (c) => c.full_name.includes(q) || (c.national_id ?? "").includes(q) || (c.phone ?? "").includes(q),
    );
  }

  return (
    <div>
      <PageHeader
        title="مخاطبین"
        subtitle="CRM دفتر: موکلین، طرف‌ها، وکلا، قضات و کارشناسان"
        actions={<ContactFormDialog />}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form action="/contacts" className="me-2">
          <input name="q" defaultValue={sp.q ?? ""} className="input h-8 w-56 text-xs" placeholder="جستجوی نام، کد ملی، تلفن…" />
          {sp.kind && <input type="hidden" name="kind" value={sp.kind} />}
        </form>
        <Link href="/contacts" className={cn("chip", !sp.kind && "border-accent bg-accent-soft font-bold text-accent-strong")}>
          همه
        </Link>
        {(Object.entries(CONTACT_KIND_FA) as [ContactKind, string][])
          .filter(([k]) => counts[k])
          .map(([k, l]) => (
            <Link key={k} href={`/contacts?kind=${k}`} className={cn("chip", sp.kind === k && "border-accent bg-accent-soft font-bold text-accent-strong")}>
              {l} {faNum(counts[k])}
            </Link>
          ))}
      </div>

      {contacts.length === 0 ? (
        <EmptyState icon={<Users />} title="مخاطبی یافت نشد" />
      ) : (
        <div className="card divide-y divide-line">
          {contacts.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[0.72rem] font-bold text-accent-strong ring-1 ring-accent-line">
                {c.full_name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[0.8rem] font-bold text-ink">{c.full_name}</p>
                  <Badge tone={KIND_TONE[c.kind]}>{CONTACT_KIND_FA[c.kind]}</Badge>
                  {c.person_type === "legal" && <Badge tone="neutral">شخص حقوقی</Badge>}
                </div>
                <p className="mt-0.5 text-[0.66rem] text-muted">
                  {[
                    c.phone && `تلفن: ${faNum(c.phone)}`,
                    c.national_id && `کد/شناسه: ${faNum(c.national_id)}`,
                    c.city,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
                {c.notes && <p className="mt-0.5 text-[0.62rem] text-faint">{c.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
