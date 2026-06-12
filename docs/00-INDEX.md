# Iranmanesh Legal OS — Documentation Index

> **سیستم‌عامل حقوقی ایرانمنش** — The AI Legal Operating System for Iranian litigators.

| # | Document | Contents |
|---|----------|----------|
| 01 | [PRD](./01-PRD.md) | Product vision, market analysis, scope, success metrics |
| 02 | [User Personas](./02-USER-PERSONAS.md) | Four research-grounded personas of Iranian lawyers |
| 03 | [User Journeys](./03-USER-JOURNEYS.md) | End-to-end journeys mapped to modules and screens |
| 04 | [Database Design](./04-DATABASE-DESIGN.md) | Full PostgreSQL schema, ERD, RLS strategy, pgvector design |
| 05 | [Feature Prioritization](./05-FEATURE-PRIORITIZATION.md) | MoSCoW + RICE scoring, MVP cutline, release plan |
| 06 | [Technical Architecture](./06-TECHNICAL-ARCHITECTURE.md) | Next.js 16 + Supabase + Vercel system design |
| 07 | [Security Architecture](./07-SECURITY-ARCHITECTURE.md) | Threat model, RLS, encryption, attorney–client privilege |
| 08 | [AI Architecture](./08-AI-ARCHITECTURE.md) | Model routing, RAG pipeline, embeddings, prompt strategy |
| 09 | [Multi-Agent Design](./09-MULTI-AGENT-DESIGN.md) | 8 specialist agents, orchestrator, tool registry, collaboration |
| 10 | [Iranian Legal Domain Model](./10-LEGAL-DOMAIN-MODEL.md) | Courts, procedural deadlines (مواعد), evidence rules, statutes |

## Quick orientation for engineers

- The product UI is **100% Persian (Farsi), RTL, Jalali-calendar-native**. English appears nowhere in the user-facing app.
- One Next.js 16 app (`/src`) is both frontend and backend (Route Handlers). Supabase provides Postgres, Auth, Storage, and pgvector.
- AI agents are TypeScript modules under `src/lib/ai/` invoked from streaming route handlers — no separate agent service, so the whole system deploys to Vercel as a single unit.
- Database schema lives in `supabase/migrations/`; demo data in `supabase/seed.sql`.
- Domain rules that encode Iranian procedure (deadline rules, court types, document taxonomies) live in `src/lib/domain/` and are mirrored in `docs/10-LEGAL-DOMAIN-MODEL.md`. **Change them together.**
