import { AiChat } from "@/components/ai/chat";
import { getDataSource } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AiWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; case?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDataSource();
  const cases = await db.listCases({ status: "active" });

  return (
    <AiChat
      cases={cases.map((c) => ({ id: c.id, title: c.title }))}
      initialAgent={sp.agent}
      initialCaseId={sp.case}
      initialQuestion={sp.q}
    />
  );
}
