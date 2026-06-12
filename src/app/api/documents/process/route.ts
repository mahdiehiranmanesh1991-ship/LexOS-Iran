import { NextRequest } from "next/server";
import { getDataSource } from "@/lib/data";
import type { DocType } from "@/lib/domain/types";
import { aiAvailable, anthropic, complete, hasAnthropic, modelFor } from "@/lib/ai/providers";
import { createSupabaseServerClient, isDemoMode } from "@/lib/supabase/server";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const DOC_TYPES: DocType[] = [
  "petition", "brief", "ruling", "service_notice", "contract",
  "poa", "evidence", "expert_opinion", "correspondence", "other",
];

/**
 * Document pipeline (docs/08 §RAG ingest):
 * upload (pdf/image/pasted text) → extract → classify → summarize → tag.
 * Status transitions persist on the row; failures are retryable.
 * Accepts multipart form: file? · text? · title · doc_type? · case_id?
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "درخواست نامعتبر است" }, { status: 400 });

  const file = form.get("file") as File | null;
  const pastedText = (form.get("text") as string | null)?.trim() || null;
  const title = ((form.get("title") as string | null) ?? file?.name ?? "سند بدون عنوان").trim();
  const caseId = (form.get("case_id") as string | null) || null;
  const userDocType = (form.get("doc_type") as string | null) || null;

  if (!file && !pastedText) {
    return Response.json({ error: "فایل یا متن سند الزامی است" }, { status: 400 });
  }

  const db = await getDataSource();

  // 1) Persist the file to private storage (production mode only).
  let storagePath: string | null = null;
  if (file && !isDemoMode()) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        storagePath = `${user.id}/${crypto.randomUUID()}/${file.name}`;
        const { error } = await supabase.storage
          .from("documents")
          .upload(storagePath, file, { contentType: file.type });
        if (error) storagePath = null;
      }
    } catch {
      storagePath = null;
    }
  }

  const doc = await db.createDocument({
    title,
    doc_type: (userDocType as DocType) ?? "other",
    case_id: caseId,
    storage_path: storagePath,
    mime_type: file?.type ?? "text/plain",
    size_bytes: file?.size ?? pastedText?.length ?? null,
    status: "processing",
  });

  try {
    // 2) Extract text.
    let text = pastedText ?? "";
    if (!text && file) {
      if (file.type === "application/pdf") {
        const { extractText } = await import("unpdf");
        const buf = new Uint8Array(await file.arrayBuffer());
        const res = await extractText(buf, { mergePages: true });
        text = typeof res.text === "string" ? res.text : "";
        await db.updateDocument(doc.id, { pages: res.totalPages ?? null });
      } else if (file.type.startsWith("image/") && hasAnthropic()) {
        // Vision OCR for Persian court scans.
        const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
        const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        const res = await anthropic().messages.create({
          model: modelFor("core").model,
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
                { type: "text", text: "متن کامل این سند فارسی را دقیق و بدون توضیح اضافه استخراج کن." },
              ],
            },
          ],
        });
        text = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
      }
    }

    if (!text.trim()) {
      await db.updateDocument(doc.id, {
        status: "failed",
        ai_summary: "متن قابل استخراج نبود — متن سند را دستی جای‌گذاری کنید.",
      });
      return Response.json({ document: await db.getDocument(doc.id) });
    }

    // 3) Classify + summarize + tag.
    let docType = (userDocType as DocType) ?? heuristicClassify(text);
    let summary: string | null = null;
    let tags: string[] = [];
    if (aiAvailable()) {
      try {
        const out = await complete({
          tier: "fast",
          system:
            "تو دسته‌بند اسناد حقوقی ایرانی هستی. خروجی را دقیقاً در ۳ خط بده:\n" +
            `نوع: یکی از {${DOC_TYPES.join("|")}}\n` +
            "خلاصه: حداکثر ۲ جمله فارسی، حقوقی و دقیق (نکته کلیدی سند چیست)\n" +
            "برچسب‌ها: حداکثر ۴ برچسب فارسی جداشده با ویرگول",
          messages: [{ role: "user", content: text.slice(0, 6000) }],
          maxTokens: 300,
          temperature: 0,
        });
        const typeMatch = out.match(/نوع:\s*([a-z_]+)/);
        const summaryMatch = out.match(/خلاصه:\s*(.+)/);
        const tagsMatch = out.match(/برچسب‌ها:\s*(.+)/);
        if (!userDocType && typeMatch && DOC_TYPES.includes(typeMatch[1] as DocType)) {
          docType = typeMatch[1] as DocType;
        }
        summary = summaryMatch?.[1]?.trim() ?? null;
        tags = tagsMatch?.[1]?.split(/[،,]/).map((t) => t.trim()).filter(Boolean).slice(0, 4) ?? [];
      } catch {
        // Classification is best-effort; extraction already succeeded.
      }
    }

    await db.updateDocument(doc.id, {
      extracted_text: text.slice(0, 200_000),
      doc_type: docType,
      ai_summary: summary,
      tags,
      status: "ready",
    });

    // J1: an ابلاغیه/رأی should prompt the deadline agent next.
    const suggestDeadlineScan = docType === "service_notice" || docType === "ruling";
    return Response.json({ document: await db.getDocument(doc.id), suggestDeadlineScan });
  } catch (err) {
    await db.updateDocument(doc.id, { status: "failed" });
    return Response.json(
      { error: err instanceof Error ? err.message : "خطا در پردازش سند" },
      { status: 500 },
    );
  }
}

/** Keyless fallback classification — keeps the demo upload flow alive. */
function heuristicClassify(text: string): DocType {
  const head = text.slice(0, 2500);
  const checks: [RegExp, DocType][] = [
    [/ابلاغیه|ابلاغ نامه|وقت رسیدگی|اخطاریه/, "service_notice"],
    [/دادنامه|رأی دادگاه|ختم رسیدگی|انشاء رأی/, "ruling"],
    [/دادخواست|خواهان|خوانده|خواسته/, "petition"],
    [/لایحه|ریاست محترم شعبه/, "brief"],
    [/قرارداد|طرف اول|طرف دوم|ماده ۱/, "contract"],
    [/وکالت‌?نامه|موکل|وکیل/, "poa"],
    [/نظریه کارشناس|کارشناس منتخب|کارشناس رسمی/, "expert_opinion"],
  ];
  for (const [re, t] of checks) if (re.test(head)) return t;
  return "other";
}
