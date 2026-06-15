import { NextRequest } from "next/server";
import { z } from "zod";
import { getDataSource } from "@/lib/data";
import type { AgentCode } from "@/lib/domain/types";
import { routeIntent, runAgentStream, type StreamEvent } from "@/lib/ai/orchestrator";
import { guardRequest } from "@/lib/security/guard";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  agent: z.string().default("orchestrator"),
  caseId: z.string().nullable().optional(),
  conversationId: z.string().nullable().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(32_000),
      }),
    )
    .min(1)
    .max(40),
});

/**
 * SSE agent chat endpoint (docs/06 §Streaming AI protocol).
 * `agent: "auto"` routes intent to the right specialist first.
 * Persists the exchange to ai_messages when a conversationId is provided.
 */
export async function POST(req: NextRequest) {
  // Size + rate + abuse + stream-concurrency guard (acquires a stream slot).
  const guard = await guardRequest(req, "ai_chat");
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(guard.body);
  if (!parsed.success) {
    guard.release();
    return Response.json({ error: "درخواست نامعتبر است" }, { status: 400 });
  }
  const { agent, caseId, conversationId, messages } = parsed.data;
  const db = await getDataSource();

  const resolvedAgent: AgentCode =
    agent === "auto"
      ? await routeIntent(messages[messages.length - 1].content)
      : (agent as AgentCode);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev: StreamEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
      let fullText = "";
      let finalCitations: StreamEvent | null = null;
      try {
        for await (const ev of runAgentStream({
          agent: resolvedAgent,
          messages,
          caseId: caseId ?? null,
          db,
        })) {
          if (ev.type === "token") fullText += ev.text;
          if (ev.type === "citations") finalCitations = ev;
          send(ev);
        }
        if (conversationId && fullText) {
          await db.appendMessage({
            conversation_id: conversationId,
            role: "user",
            content: messages[messages.length - 1].content,
          });
          await db.appendMessage({
            conversation_id: conversationId,
            role: "assistant",
            content: fullText,
            agent: resolvedAgent,
            citations: finalCitations?.type === "citations" ? finalCitations.citations : [],
          });
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "خطای داخلی",
        });
      } finally {
        guard.release(); // cleanup on completion / error / timeout
        controller.close();
      }
    },
    cancel() {
      guard.release(); // cleanup on client disconnect
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
