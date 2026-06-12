import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import type { DataSource } from "@/lib/data/types";
import { computeDeadline, DEADLINE_RULES } from "@/lib/domain/deadlines";
import { searchCorpus } from "@/lib/domain/legal-corpus";
import { getTemplate } from "@/lib/domain/templates";
import { CASE_STAGE_FA, CASE_TYPE_FA, CLIENT_POSITION_FA, PARTY_ROLE_FA } from "@/lib/domain/taxonomies";
import type { Citation } from "@/lib/domain/types";
import { faNum, formatJalaliNumeric, parseDateInput } from "@/lib/jalali";

/**
 * Shared agent tool registry (docs/09). Tools are owner-scoped because they
 * close over the request's DataSource — an agent physically cannot read
 * another tenant. Retrieved text is data, never instructions.
 */

export interface ProposedAction {
  type: "create_deadline";
  payload: {
    case_id: string | null;
    title: string;
    rule_code: string;
    citation: string;
    trigger_date: string;
    is_abroad: boolean;
    due_at: string;
    explanation: string;
  };
}

export interface ToolOutcome {
  /** Text returned to the model. */
  result: string;
  citations?: Citation[];
  actions?: ProposedAction[];
}

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "get_case_brief",
    description:
      "دریافت خلاصه ساخت‌یافته یک پرونده: مشخصات، طرفین، مرحله، رویدادهای اخیر، مواعد و جلسات. همیشه پیش از تحلیل پرونده صدا بزن.",
    input_schema: {
      type: "object" as const,
      properties: { case_id: { type: "string", description: "شناسه پرونده" } },
      required: ["case_id"],
    },
  },
  {
    name: "search_case_documents",
    description: "جستجو در اسناد (خلاصه‌ها و متن استخراج‌شده). برای یافتن مدارک مرتبط با یک موضوع.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string" },
        case_id: { type: "string", description: "اختیاری — محدود به یک پرونده" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_document_text",
    description: "دریافت متن کامل استخراج‌شده یک سند مشخص.",
    input_schema: {
      type: "object" as const,
      properties: { document_id: { type: "string" } },
      required: ["document_id"],
    },
  },
  {
    name: "search_legal_articles",
    description:
      "جستجو در مواد قانونی ایران (قانون مدنی، آیین دادرسی، تجارت، چک، مجازات و …) و آرای وحدت رویه. برای هر ادعای حقوقی ابتدا این را صدا بزن و فقط به نتایج استناد کن.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "موضوع حقوقی به فارسی" },
        law_code: { type: "string", description: "اختیاری — محدود به یک قانون (مثل civil_code)" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_knowledge_notes",
    description: "جستجوی معنایی در گنجینه دانش وکیل: تجربه‌ها، استدلال‌های برنده، رویه قضات.",
    input_schema: {
      type: "object" as const,
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "list_deadline_rules",
    description: "فهرست قواعد مواعد قانونی (واخواهی، تجدیدنظر، فرجام و …) با مهلت و استناد.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "compute_deadline",
    description:
      "محاسبه قطعی یک موعد قانونی با موتور قواعد (نه با حدس). ورودی: کد قاعده + تاریخ ابلاغ/مبدأ + داخل/خارج کشور.",
    input_schema: {
      type: "object" as const,
      properties: {
        rule_code: { type: "string" },
        trigger_date: { type: "string", description: "تاریخ مبدأ — جلالی مثل 1405/03/22 یا ISO" },
        is_abroad: { type: "boolean" },
      },
      required: ["rule_code", "trigger_date"],
    },
  },
  {
    name: "propose_deadline",
    description:
      "پیشنهاد ثبت موعد به کاربر (با کارت تأیید). هرگز موعد را مستقیم ثبت نکن؛ فقط پیشنهاد بده.",
    input_schema: {
      type: "object" as const,
      properties: {
        case_id: { type: "string", description: "شناسه پرونده (در صورت وجود)" },
        rule_code: { type: "string" },
        trigger_date: { type: "string" },
        is_abroad: { type: "boolean" },
        title: { type: "string", description: "عنوان موعد" },
      },
      required: ["rule_code", "trigger_date", "title"],
    },
  },
  {
    name: "get_template",
    description: "دریافت اسکلت رسمی یک نوع سند (دادخواست، لایحه، واخواهی، شکواییه، اظهارنامه، قرارداد).",
    input_schema: {
      type: "object" as const,
      properties: {
        code: {
          type: "string",
          description:
            "petition_civil | defense_brief | vakhahi_petition | appeal_brief | criminal_complaint | formal_notice | contract_generic",
        },
      },
      required: ["code"],
    },
  },
];

/** Wrap retrieved content as untrusted data (prompt-injection defense). */
function untrusted(label: string, body: string): string {
  return `<منبع عنوان="${label}">\n${body}\n</منبع>`;
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  db: DataSource,
): Promise<ToolOutcome> {
  switch (name) {
    case "get_case_brief": {
      const c = await db.getCase(String(input.case_id));
      if (!c) return { result: "پرونده‌ای با این شناسه یافت نشد." };
      const parties = c.parties
        .map((p) => `${PARTY_ROLE_FA[p.role]}: ${p.contact?.full_name ?? "—"}`)
        .join("، ");
      const events = c.events
        .slice(0, 12)
        .map((e) => `- ${formatJalaliNumeric(e.event_date)}: ${e.title}${e.description ? ` (${e.description})` : ""}`)
        .join("\n");
      const deadlines = c.deadlines
        .filter((d) => d.status === "open")
        .map((d) => `- ${d.title} — سررسید ${formatJalaliNumeric(d.due_at)}${d.citation ? ` [${d.citation}]` : ""}`)
        .join("\n");
      const docs = c.documents
        .map((d) => `- (${d.id}) ${d.title}: ${d.ai_summary ?? "بدون خلاصه"}`)
        .join("\n");
      const brief = [
        `پرونده: ${c.title} (بایگانی ${c.archive_no}${c.case_no ? ` — کلاسه ${c.case_no}` : ""})`,
        `نوع: ${CASE_TYPE_FA[c.case_type]} | مرحله: ${CASE_STAGE_FA[c.stage]} | سمت موکل: ${CLIENT_POSITION_FA[c.client_position]}`,
        `خواسته/موضوع: ${c.subject}`,
        c.court ? `مرجع: ${c.court.name}${c.court_branch ? ` — ${c.court_branch}` : ""}${c.judge_name ? ` — ${c.judge_name}` : ""}` : "",
        `طرفین: ${parties}`,
        c.description ? `شرح: ${c.description}` : "",
        deadlines ? `مواعد باز:\n${deadlines}` : "موعد بازی ثبت نشده.",
        events ? `رویدادهای اخیر:\n${events}` : "",
        docs ? `اسناد:\n${docs}` : "سندی بارگذاری نشده.",
      ]
        .filter(Boolean)
        .join("\n");
      return {
        result: untrusted(`پرونده ${c.archive_no}`, brief),
      };
    }

    case "search_case_documents": {
      const q = String(input.query ?? "");
      const caseId = input.case_id ? String(input.case_id) : null;
      const docs = await db.listDocuments();
      const scored = docs
        .filter((d) => !caseId || d.case_id === caseId)
        .map((d) => {
          const hay = `${d.title} ${d.ai_summary ?? ""} ${d.extracted_text ?? ""} ${d.tags.join(" ")}`;
          const terms = q.split(/\s+/).filter(Boolean);
          const score = terms.filter((t) => hay.includes(t)).length;
          return { d, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
      if (!scored.length) return { result: "سند مرتبطی یافت نشد." };
      return {
        result: scored
          .map(({ d }) =>
            untrusted(
              d.title,
              `شناسه: ${d.id}\nخلاصه: ${d.ai_summary ?? "—"}\nگزیده متن: ${(d.extracted_text ?? "").slice(0, 600)}`,
            ),
          )
          .join("\n\n"),
        citations: scored.map(({ d }) => ({ kind: "document" as const, id: d.id, label: d.title })),
      };
    }

    case "get_document_text": {
      const d = await db.getDocument(String(input.document_id));
      if (!d) return { result: "سند یافت نشد." };
      return {
        result: untrusted(d.title, (d.extracted_text ?? "متن استخراج نشده است.").slice(0, 12_000)),
        citations: [{ kind: "document", id: d.id, label: d.title }],
      };
    }

    case "search_legal_articles": {
      const rows = searchCorpus(String(input.query ?? ""), 8, input.law_code ? String(input.law_code) : undefined);
      if (!rows.length) return { result: "ماده‌ای متناظر در پیکره فعلی یافت نشد — صریحاً بگو منبع در دسترس نیست." };
      return {
        result: rows
          .map((r) => untrusted(`${r.law_title_fa} — ماده ${r.article_no}`, r.text_fa))
          .join("\n\n"),
        citations: rows.map((r) => ({
          kind: "article" as const,
          id: r.id,
          label: `ماده ${faNum(r.article_no)} ${r.law_title_fa}`,
        })),
      };
    }

    case "search_knowledge_notes": {
      const notes = await db.listNotes(String(input.query ?? ""));
      const top = notes.slice(0, 5);
      if (!top.length) return { result: "یادداشتی در گنجینه دانش یافت نشد." };
      return {
        result: top
          .map((n) => untrusted(`یادداشت: ${n.title}`, n.content_md.slice(0, 1200)))
          .join("\n\n"),
        citations: top.map((n) => ({ kind: "note" as const, id: n.id, label: n.title })),
      };
    }

    case "list_deadline_rules": {
      return {
        result: DEADLINE_RULES.map(
          (r) =>
            `- ${r.code}: ${r.title_fa} — ${faNum(r.days_inside)} روز داخل / ${faNum(r.days_abroad)} روز خارج (${r.citation})`,
        ).join("\n"),
      };
    }

    case "compute_deadline": {
      const trigger = parseDateInput(String(input.trigger_date ?? ""));
      if (!trigger) return { result: "تاریخ مبدأ نامعتبر است. قالب جلالی 1405/03/22 یا ISO بده." };
      try {
        const comp = computeDeadline(String(input.rule_code), trigger, Boolean(input.is_abroad));
        return {
          result: `${comp.explanationFa}\n(تاریخ ISO برای ثبت: ${comp.dueISO})`,
          citations: [{ kind: "rule", id: comp.rule.code, label: comp.rule.citation }],
        };
      } catch {
        return { result: "کد قاعده نامعتبر است. ابتدا list_deadline_rules را صدا بزن." };
      }
    }

    case "propose_deadline": {
      const trigger = parseDateInput(String(input.trigger_date ?? ""));
      if (!trigger) return { result: "تاریخ مبدأ نامعتبر است." };
      try {
        const comp = computeDeadline(String(input.rule_code), trigger, Boolean(input.is_abroad));
        return {
          result: `پیشنهاد موعد ساخته شد و برای تأیید به کاربر نمایش داده می‌شود: ${comp.explanationFa}`,
          citations: [{ kind: "rule", id: comp.rule.code, label: comp.rule.citation }],
          actions: [
            {
              type: "create_deadline",
              payload: {
                case_id: input.case_id ? String(input.case_id) : null,
                title: String(input.title ?? comp.rule.title_fa),
                rule_code: comp.rule.code,
                citation: comp.rule.citation,
                trigger_date: comp.triggerDate.toISOString().slice(0, 10),
                is_abroad: comp.isAbroad,
                due_at: comp.dueISO,
                explanation: comp.explanationFa,
              },
            },
          ],
        };
      } catch {
        return { result: "کد قاعده نامعتبر است. ابتدا list_deadline_rules را صدا بزن." };
      }
    }

    case "get_template": {
      const t = getTemplate(String(input.code));
      if (!t) return { result: "قالبی با این کد وجود ندارد." };
      return { result: untrusted(`قالب ${t.title_fa}`, t.skeleton_md) };
    }

    default:
      return { result: `ابزار ${name} مجاز یا موجود نیست.` };
  }
}
