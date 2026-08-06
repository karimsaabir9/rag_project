# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (Turbopack) at http://localhost:3000
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config, eslint-config-next)
```

There is no test suite configured yet.

## Project overview

A RAG ("chat with your documents") app being built as a lesson project: Next.js 16 App Router + React 19, Mongoose/MongoDB for metadata and chat storage, LangChain for document loading/splitting, shadcn/ui (`style: base-nova`, base color `neutral`) + Tailwind v4 for UI.

**This is a work in progress, not a finished feature.** Large parts of the pipeline are stubbed with `TODO`s or commented out:
- `app/api/upload/route.ts` saves a `Document` record but never calls `processDocument`, never generates embeddings, never stores vectors, and never updates the document status past `"processing"`. Its `catch` block is empty (silently swallows errors).
- `lib/document-processor.ts` only implements PDF extraction (`processPDF` via `@langchain/community`'s `PDFLoader`); the `docx` and `txt`/`md` branches are commented out and currently no-op (leave `content` as `""`).
- No vector store / embeddings integration exists yet despite the upload route's comments referencing it and `mongodb`/`pinecone`-shaped fields (`chunkCount`, `vectorCount`) already on the `Document` schema.
- `app/page.tsx` renders a static/mocked UI (hardcoded `[{ status: "completed" }]` array, commented-out `FileUpload`/`DocumentList` components, no-op buttons) — there's no client-side data fetching wired up yet.

When picking up work here, expect to be completing or replacing these stubs rather than extending a working pipeline.

## Architecture

- **`app/`** — Next.js App Router. `app/page.tsx` is the single-page UI shell; `app/api/upload/route.ts` is the only API route so far.
- **`lib/mongodb.ts`** — Mongoose connection (`connectDB`, module-level `isConnected` flag) plus the `Document` and `Message` schemas/models and simple CRUD helpers (`createDocument`, `getDocument`, `getAllDocuments`, `updateDocument`, `deleteDocument`, `saveMessage`, `getMessages`). This is the single source of truth for data-layer shape — extend schemas/helpers here rather than querying Mongoose models directly from routes.
- **`lib/document-processor.ts`** — `processDocument(file)` dispatches on file extension to per-type extractors, then chunks extracted text via `@langchain/textsplitters`'s `RecursiveCharacterTextSplitter` (chunkSize 2000, overlap 400) and prefixes each chunk with `Document: <name>` for retrieval context.
- **`components/ui/`** — shadcn/ui primitives (currently just `button.tsx`, `card.tsx`). Add new primitives with the shadcn CLI (`components.json` aliases: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`) rather than hand-rolling them.
- **`lib/utils.ts`** — `cn()` helper (clsx + tailwind-merge), the usual shadcn convention for merging class names.
- Path alias `@/*` maps to the project root (see `tsconfig.json`).

## Environment

- `MONGODB_URI` is required (`lib/mongodb.ts` throws if unset) — set in `.env` (gitignored). Local default used in this repo: `mongodb://localhost:27017/rag-system`.
- No embeddings/vector-store provider (e.g. Pinecone, OpenAI) is configured yet — if implementing that part of the pipeline, credentials/config will need to be added to `.env` and read from `process.env` following the `MONGODB_URI` pattern.

## Conventions in this codebase

- Mongoose models are read with `mongoose.models.X || mongoose.model(...)` to survive Next.js hot-reload re-imports — follow this pattern for any new models.
- API routes return `NextResponse.json({ error: ... }, { status })` for error cases; validate input early and return before doing DB/processing work.
- Heavy/optional deps (`@langchain/community`'s `PDFLoader`, `@langchain/textsplitters`) are dynamically `import()`ed inside functions rather than imported at module top — keep doing this for other document-format loaders to avoid bundling unused parsers.
