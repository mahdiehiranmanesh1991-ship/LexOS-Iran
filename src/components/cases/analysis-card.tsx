import { AlertTriangle, BookOpen, Lightbulb, ListChecks, SearchX, ShieldAlert } from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import { Badge } from "@/components/ui/badge";
import { AGENT_FA, ANALYSIS_KIND_FA } from "@/lib/domain/taxonomies";
import type { AiAnalysis, AnalysisItem } from "@/lib/domain/types";
import { formatJalaliLong } from "@/lib/jalali";
import { cn } from "@/lib/utils";

const SEVERITY_TONE = { high: "danger", medium: "warn", low: "neutral" } as const;
const SEVERITY_FA = { high: "پرریسک", medium: "متوسط", low: "کم" } as const;

function ItemGroup({
  title,
  icon,
  items,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  items?: AnalysisItem[];
  tone: "danger" | "warn" | "info" | "accent";
}) {
  if (!items?.length) return null;
  const toneCls = {
    danger: "border-danger-line bg-danger-soft/50 text-danger",
    warn: "border-warn-line bg-warn-soft/60 text-warn",
    info: "border-info-line bg-info-soft/60 text-info",
    accent: "border-accent-line bg-accent-soft/60 text-accent-strong",
  }[tone];
  return (
    <div className={cn("rounded-xl border p-3.5", toneCls)}>
      <div className="mb-2 flex items-center gap-1.5 text-[0.72rem] font-bold">
        {icon}
        {title}
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg bg-surface/70 px-3 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[0.74rem] font-bold text-ink">{it.title}</span>
              {it.severity && (
                <Badge tone={SEVERITY_TONE[it.severity]}>{SEVERITY_FA[it.severity]}</Badge>
              )}
              {it.citation && <Badge tone="info">{it.citation}</Badge>}
            </div>
            <p className="mt-1 text-[0.7rem] leading-6 text-ink-2">{it.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Persisted structured AI report — the product surface, not chat scroll (docs/08). */
export function AnalysisCard({ analysis, compact }: { analysis: AiAnalysis; compact?: boolean }) {
  const s = analysis.structured;
  return (
    <article className="card overflow-hidden">
      <header className="flex flex-wrap items-center gap-2 border-b border-line bg-raised px-4 py-3">
        <Badge tone="accent">{ANALYSIS_KIND_FA[analysis.kind]}</Badge>
        <span className="text-[0.8rem] font-bold text-ink">{analysis.title}</span>
        <span className="ms-auto flex items-center gap-2 text-[0.62rem] text-muted">
          <span>{AGENT_FA[analysis.agent]?.name}</span>·
          <span>{formatJalaliLong(analysis.created_at)}</span>
          {analysis.model && analysis.model !== "demo" && (
            <code className="rounded bg-inset px-1.5 py-0.5 text-[0.58rem]" dir="ltr">
              {analysis.model}
            </code>
          )}
        </span>
      </header>

      <div className="space-y-4 p-4">
        {!compact && <Markdown>{analysis.content_md}</Markdown>}

        {s && (
          <div className="grid gap-3 lg:grid-cols-2">
            <ItemGroup title="ریسک‌ها" tone="danger" icon={<ShieldAlert className="h-3.5 w-3.5" />} items={s.risks} />
            <ItemGroup title="نقاط ضعف" tone="warn" icon={<AlertTriangle className="h-3.5 w-3.5" />} items={s.weaknesses} />
            <ItemGroup title="فرصت‌ها" tone="accent" icon={<Lightbulb className="h-3.5 w-3.5" />} items={s.opportunities} />
            <ItemGroup title="ادله ناقص" tone="info" icon={<SearchX className="h-3.5 w-3.5" />} items={s.missing_evidence} />
          </div>
        )}

        {s?.suggested_articles?.length ? (
          <div className="rounded-xl border border-line bg-raised p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[0.72rem] font-bold text-ink-2">
              <BookOpen className="h-3.5 w-3.5 text-accent" /> مواد قابل استناد
            </div>
            <div className="flex flex-wrap gap-1.5">
              {s.suggested_articles.map((a, i) => (
                <span key={i} className="chip" title={a.why}>
                  ماده {a.article} {a.law}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {s?.next_steps?.length ? (
          <div className="rounded-xl border border-line bg-raised p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[0.72rem] font-bold text-ink-2">
              <ListChecks className="h-3.5 w-3.5 text-accent" /> گام‌های بعدی
            </div>
            <ol className="list-inside space-y-1 text-[0.74rem] leading-6 text-ink-2" style={{ listStyleType: "persian" }}>
              {s.next_steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}

        <p className="text-[0.6rem] text-faint">
          ⚖️ خروجی هوش مصنوعی است — پیش از استناد، مواد و مستندات را راستی‌آزمایی کنید.
        </p>
      </div>
    </article>
  );
}
