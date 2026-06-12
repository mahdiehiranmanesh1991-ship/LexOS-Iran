/**
 * Sync the TypeScript sources of truth into Supabase reference tables
 * (service role) and compute corpus embeddings when OPENAI_API_KEY is set.
 *
 *   npx tsx scripts/seed-reference-data.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: OPENAI_API_KEY (embeddings for semantic legal search)
 */
import { createClient } from "@supabase/supabase-js";
import { DEADLINE_RULES } from "../src/lib/domain/deadlines";
import { LEGAL_CORPUS } from "../src/lib/domain/legal-corpus";
import { DRAFT_TEMPLATES } from "../src/lib/domain/templates";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY لازم است");
  process.exit(1);
}
const supabase = createClient(url, serviceKey);

async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return texts.map(() => null);
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
  });
  if (!res.ok) {
    console.warn(`⚠ embeddings failed (${res.status}) — seeding without vectors`);
    return texts.map(() => null);
  }
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data.map((d) => d.embedding);
}

async function main() {
  console.log("→ deadline_rules");
  const { error: e1 } = await supabase.from("deadline_rules").upsert(DEADLINE_RULES);
  if (e1) throw e1;

  console.log("→ draft_templates");
  const { error: e2 } = await supabase.from("draft_templates").upsert(
    DRAFT_TEMPLATES.map((t) => ({
      code: t.code,
      title_fa: t.title_fa,
      doc_kind: t.doc_kind,
      description_fa: t.description_fa,
      skeleton_md: t.skeleton_md,
    })),
  );
  if (e2) throw e2;

  console.log(`→ legal_articles (${LEGAL_CORPUS.length} مورد)${process.env.OPENAI_API_KEY ? " + embeddings" : ""}`);
  for (let i = 0; i < LEGAL_CORPUS.length; i += 32) {
    const batch = LEGAL_CORPUS.slice(i, i + 32);
    const vectors = await embedBatch(
      batch.map((a) => `${a.law_title_fa} ماده ${a.article_no}: ${a.text_fa}`),
    );
    const { error } = await supabase.from("legal_articles").upsert(
      batch.map((a, j) => ({
        id: a.id,
        kind: a.kind,
        law_code: a.law_code,
        law_title_fa: a.law_title_fa,
        article_no: a.article_no,
        text_fa: a.text_fa,
        topic_tags: a.topic_tags,
        embedding: vectors[j],
      })),
    );
    if (error) throw error;
    console.log(`   ${Math.min(i + 32, LEGAL_CORPUS.length)}/${LEGAL_CORPUS.length}`);
  }

  console.log("✓ reference data synced");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
