"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlarmClock,
  BookMarked,
  Bot,
  Check,
  CornerDownLeft,
  FileText,
  Loader2,
  Sparkles,
  StickyNote,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { confirmDeadlineProposalAction } from "@/app/actions";
import { Markdown } from "@/components/shared/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENT_FA } from "@/lib/domain/taxonomies";
import type { AgentCode, Citation, LegalCase } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

interface ProposedDeadline {
  case_id: string | null;
  title: string;
  rule_code: string;
  citation: string;
  trigger_date: string;
  is_abroad: boolean;
  due_at: string;
  explanation: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  agent?: AgentCode;
  citations?: Citation[];
  actions?: { type: "create_deadline"; payload: ProposedDeadline }[];
}

const CITATION_ICON: Record<Citation["kind"], React.ReactNode> = {
  article: <BookMarked className="h-3 w-3" />,
  document: <FileText className="h-3 w-3" />,
  note: <StickyNote className="h-3 w-3" />,
  rule: <AlarmClock className="h-3 w-3" />,
};

const SUGGESTIONS = [
  "فرق خلع ید و تصرف عدوانی چیست و کدام برای موکل با سند رسمی بهتر است؟",
  "دادنامه غیابی دیروز ابلاغ واقعی شد؛ مهلت واخواهی را حساب و پیشنهاد ثبت بده.",
  "برای دعوای مطالبه وجه چک چه ادله‌ای لازم دارم؟",
  "یک اظهارنامه برای تخلیه مغازه پس از انقضای مدت اجاره بنویس.",
];

export function AiChat({
  cases,
  initialAgent,
  initialCaseId,
  initialQuestion,
}: {
  cases: Pick<LegalCase, "id" | "title">[];
  initialAgent?: string;
  initialCaseId?: string;
  initialQuestion?: string;
}) {
  const [agent, setAgent] = useState<string>(initialAgent ?? "auto");
  const [caseId, setCaseId] = useState<string>(initialCaseId ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialQuestion ?? "");
  const [streaming, setStreaming] = useState(false);
  const [toolLabel, setToolLabel] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoSent = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, toolLabel]);

  // Deep-link auto-send (e.g. the ابلاغیه → deadline-agent handoff).
  useEffect(() => {
    if (initialQuestion && !autoSent.current) {
      autoSent.current = true;
      void send(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");
    const userMsg: ChatMessage = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);
    setToolLabel(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent,
          caseId: caseId || null,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!res.ok || !res.body) throw new Error("پاسخ سرور نامعتبر بود");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const patchLast = (fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = fn(next[next.length - 1]);
          return next;
        });

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const raw of events) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(line.slice(5));
          } catch {
            continue;
          }
          switch (ev.type) {
            case "agent":
              setActiveAgent(ev.name as string);
              patchLast((m) => ({ ...m, agent: ev.agent as AgentCode }));
              break;
            case "token":
              patchLast((m) => ({ ...m, content: m.content + (ev.text as string) }));
              break;
            case "tool":
              setToolLabel(ev.status === "start" ? (ev.label as string) : null);
              break;
            case "citations":
              patchLast((m) => ({ ...m, citations: ev.citations as Citation[] }));
              break;
            case "actions":
              patchLast((m) => ({ ...m, actions: ev.actions as ChatMessage["actions"] }));
              break;
            case "error":
              toast.error(ev.message as string);
              patchLast((m) => ({
                ...m,
                content: m.content || `⚠️ ${ev.message as string}`,
              }));
              break;
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در گفتگو");
    } finally {
      setStreaming(false);
      setToolLabel(null);
      setActiveAgent(null);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-10.5rem)] min-h-[28rem] flex-col md:h-[calc(100dvh-9rem)]">
      <div className="mb-3 flex flex-wrap items-center gap-2 no-print">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <select value={agent} onChange={(e) => setAgent(e.target.value)} className="input h-8 w-auto min-w-44 text-xs">
            <option value="auto">انتخاب خودکار ایجنت (پیشنهادی)</option>
            {Object.entries(AGENT_FA).map(([code, a]) => (
              <option key={code} value={code}>{a.name}</option>
            ))}
          </select>
        </div>
        <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="input h-8 w-auto min-w-44 text-xs">
          <option value="">بدون زمینه پرونده</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        {agent !== "auto" && (
          <span className="text-[0.64rem] text-muted">{AGENT_FA[agent as AgentCode]?.description}</span>
        )}
      </div>

      <div className="card flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft ring-1 ring-accent-line">
              <Bot className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-[0.9rem] font-bold text-ink">دستیار حقوقی ایرانمنش</p>
              <p className="mx-auto mt-1 max-w-md text-[0.7rem] leading-6 text-muted">
                ۸ ایجنت متخصص: تحلیل پرونده، مواعد، قرارداد، املاک، استراتژی، ادله، پژوهش و نگارش.
                هر پاسخ مستند به ماده قانونی یا اسناد شماست.
              </p>
            </div>
            <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border border-line bg-raised px-3.5 py-2.5 text-start text-[0.7rem] leading-6 text-ink-2 transition-all hover:border-accent-line hover:bg-accent-soft/40 hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                m.role === "user" ? "bg-ink text-white" : "bg-accent-soft text-accent ring-1 ring-accent-line",
              )}
            >
              {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div className={cn("min-w-0 max-w-[85%] space-y-2", m.role === "user" && "text-end")}>
              {m.role === "assistant" && m.agent && (
                <Badge tone="accent">{AGENT_FA[m.agent]?.name ?? m.agent}</Badge>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5",
                  m.role === "user"
                    ? "inline-block bg-ink text-start text-[0.8rem] leading-7 text-white"
                    : "border border-line bg-surface",
                )}
              >
                {m.role === "user" ? (
                  m.content
                ) : m.content ? (
                  <Markdown>{m.content}</Markdown>
                ) : (
                  <span className="flex items-center gap-2 py-1 text-xs text-muted">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {toolLabel ?? (activeAgent ? `${activeAgent} در حال بررسی…` : "در حال فکر کردن…")}
                  </span>
                )}
              </div>

              {m.role === "assistant" && streaming && i === messages.length - 1 && m.content && toolLabel && (
                <p className="flex items-center gap-1.5 text-[0.64rem] text-accent">
                  <Loader2 className="h-3 w-3 animate-spin" /> {toolLabel}
                </p>
              )}

              {m.citations && m.citations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.citations.map((c) => (
                    <span key={`${c.kind}-${c.id}`} className="chip" title={c.locator}>
                      <span className="text-accent">{CITATION_ICON[c.kind]}</span>
                      {c.label}
                    </span>
                  ))}
                </div>
              )}

              {m.actions?.map((a, j) =>
                a.type === "create_deadline" ? (
                  <DeadlineProposalCard key={j} payload={a.payload} />
                ) : null,
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="mt-3 flex items-end gap-2 no-print"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder="پرسش حقوقی، دستور تحلیل یا درخواست پیش‌نویس… (Enter برای ارسال)"
          className="input flex-1 resize-none leading-7"
        />
        <Button type="submit" variant="primary" size="lg" disabled={streaming || !input.trim()} className="gap-1.5">
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CornerDownLeft className="h-4 w-4" />}
          ارسال
        </Button>
      </form>
    </div>
  );
}

/** The propose→confirm contract: agent proposes, lawyer confirms, engine persists. */
function DeadlineProposalCard({ payload }: { payload: ProposedDeadline }) {
  const [pending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="rounded-xl border border-accent-line bg-accent-soft/60 p-3.5">
      <div className="flex items-center gap-1.5 text-[0.74rem] font-bold text-accent-strong">
        <AlarmClock className="h-3.5 w-3.5" /> پیشنهاد ثبت موعد قانونی
      </div>
      <p className="mt-1.5 text-[0.78rem] font-bold text-ink">{payload.title}</p>
      <p className="mt-1 text-[0.66rem] leading-6 text-ink-2">{payload.explanation}</p>
      <div className="mt-2.5 flex items-center gap-2">
        {confirmed ? (
          <Badge tone="ok"><Check className="h-3 w-3" /> در تقویم ثبت شد</Badge>
        ) : (
          <>
            <Button
              size="sm"
              variant="primary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await confirmDeadlineProposalAction(payload);
                  setConfirmed(true);
                  toast.success("موعد با استناد قانونی ثبت شد");
                })
              }
              className="gap-1"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              تأیید و ثبت
            </Button>
            <span className="text-[0.6rem] text-muted">{payload.citation}</span>
          </>
        )}
      </div>
    </div>
  );
}
