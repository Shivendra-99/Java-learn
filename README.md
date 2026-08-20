# Java Learn

A free, interactive Core Java course — 66 lessons (including a Design Patterns
section) with steppable memory diagrams, line-by-line execution traces, "what
does this print?" challenges, quizzes with saved progress, and a searchable bank
of 92 interview questions.

Built with the same scaffold as the React, Spring Boot and Git courses: Vite,
React 19, TypeScript, Tailwind 4, Radix primitives, Framer Motion, and React
Router.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:5175.

## Scripts

| Script                     | What it does                                       |
| -------------------------- | -------------------------------------------------- |
| `npm run dev`              | Dev server with HMR                                 |
| `npm run build`            | Regenerates the sitemap, type-checks, and builds    |
| `npm run preview`          | Serves the production build locally                 |
| `npm run generate:sitemap` | Rewrites `public/sitemap.xml` from the lesson list  |
| `npm run lint`             | Oxlint                                              |

## Structure

```
src/
├── lessons/            66 lesson components, lazily loaded
├── lib/
│   ├── lessons-data.tsx       curriculum index: slugs, sections, icons, order
│   ├── interview-questions.ts the 92-question bank
│   ├── interview-simple.ts    plain-English version of every answer
│   └── site-config.ts         SITE_URL, name, default meta description
├── components/
│   ├── diagram/        memory-diagram (stack & heap), type-hierarchy-diagram,
│   │                   compile-pipeline, step-flow-diagram
│   ├── lesson/         execution-trace, output-predictor, code-walkthrough,
│   │                   terminal-demo, callout, quiz, challenge, key-takeaways, …
│   ├── layout/         topbar, sidebar-nav, command palette (⌘K), app shell
│   └── ui/             Radix-based primitives
├── context/            theme (dark/light) and progress (localStorage)
└── pages/              home, lesson-page, interview-questions, not-found
```

## The Java-specific components

Four interactive pieces were written for this course rather than inherited from
the scaffold:

- **`MemoryDiagram`** — steps through the call stack and heap side by side, with
  references rendered as chips that highlight their target. Used for aliasing,
  pass-by-value, static fields, garbage collection and the string pool.
- **`ExecutionTrace`** — walks a snippet line by line, showing variables and
  console output as they change. Used for loops, initialisation order and
  pre/post increment.
- **`OutputPredictor`** — "what does this print?" with the explanation hidden
  until the reader commits to an answer. Answers persist alongside quiz results.
- **`TypeHierarchyDiagram`** — a clickable type tree for the collections
  framework, the `Throwable` hierarchy, `java.time`, and inheritance examples.

## Adding a lesson

1. Create `src/lessons/NN-slug.tsx` exporting a default component.
2. Add an entry to `lessonDefinitions` in `src/lib/lessons-data.tsx` — slug,
   order, section, titles, description, a `lucide-react` icon, minutes, and the
   dynamic `load` import.
3. Run `npm run build` (the sitemap regenerates automatically).

The sidebar, home page outline, command palette, prev/next footer links, and
progress totals all read from `lessons-data.tsx`, so nothing else needs touching.

Two JSX gotchas worth knowing when writing lesson prose: raw `{` and `}` in text
must be wrapped (`<code>{"static { ... }"}</code>`), and attribute strings cannot
contain escaped quotes — use a `{\`template literal\`}` instead.

## Deployment

`vercel.json` rewrites every path to `index.html` for client-side routing. After
attaching a custom domain, update `SITE_URL` in `src/lib/site-config.ts` and
`public/robots.txt`, then re-run `npm run generate:sitemap`.
