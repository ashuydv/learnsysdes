# Adding a new HLD practice problem

"Problems" (as opposed to "modules") are the practice exercises under `/problems` —
a requirements list, a canvas to sketch a design, and a reference solution to compare
against. All problem content lives in `prisma/seed.ts` as data, not in the DB directly.

## Steps

1. Open `prisma/seed.ts` and add an entry to the `problems: ProblemSeed[]` array,
   near the bottom of the file, before `main()`.
2. `slug` must be unique and URL-safe (kebab-case) — it becomes `/problems/<slug>`.
3. `order` must be a unique integer — check the last entry in the array for the
   current max and increment by 1. This controls list position on `/problems`.
4. Fill `requirements.functional` / `requirements.nonFunctional` as short bullet
   strings — these render as a checklist on the problem page.
5. Write `referenceSolution` as a markdown string using this section structure
   (copy the closest existing problem as a template rather than starting blank):
   - `## Summary` — 1-2 sentences: the core mechanism that makes this design work
   - `## Key strengths` — 2-4 bullets, bolded lead-in phrase + why it matters
   - `## Approach` — a short paragraph describing the overall design
   - `## API endpoints` — a markdown table: Method | Path | Description
   - `## Data model` — a markdown table: Field | Type | Description
   - One or more problem-specific deep-dive sections (e.g. "Handling partial
     failures", "Cold-start fallback") — pick names that match what's actually
     hard about *this* problem, don't force a generic template
   - `## Estimates` — back-of-envelope numbers (QPS, storage, ratios)
   - `## Future improvements` — 2 bullets on natural next steps
6. Build `diagram.nodes` and `diagram.edges`:
   - Each node needs `id`, `label`, `x`, `y`, `kind`. `kind` must be one of the
     `DiagramNodeKind` values in `src/lib/diagram-builder.ts`: `client`, `cdn`,
     `lb`, `service`, `cache`, `db`, `queue`, `generic` — each has a fixed color.
     `cdn` doubles as the "external third-party system" kind (payment provider,
     push/email/SMS providers, external APIs) in existing problems.
   - Lay nodes out left-to-right roughly matching request flow (client → gateway
     → services → storage), reusing the x/y spacing conventions in nearby
     problems (~240px column gaps, ~200px row gaps) so diagrams stay visually
     consistent.
   - Edges are `{ from, to, label? }` referencing node `id`s. Label the ones that
     clarify protocol/intent (e.g. `"POST /api/v1/checkout"`); skip labels on
     obvious plumbing.
7. The `problems` array entry gets turned into an Excalidraw scene automatically
   by `buildDiagramSnapshot()` (in `src/lib/diagram-builder.ts`) at seed time —
   don't hand-build Excalidraw elements.

## Applying it

Problems are upserted by `slug`, so re-running the seed is always safe — it
updates existing rows rather than duplicating them.

```
docker compose up -d        # start Postgres if it isn't running
npx prisma db seed
```

## Adding a "module" instead

Modules (the lesson content under `/modules`, with a quiz) follow the same
data-in-`seed.ts` pattern via the `modules: ModuleSeed[]` array — `slug`,
`title`, `order` (unique), `summary`, `content` (markdown), and `quiz`
(5 multiple-choice `QuizQuestion` objects). Use this file's conventions for
that too if asked to add a module.
