# Job-Inator documentation

Reference documentation for the `src/` tree. Start with `architecture.md` for the big picture,
then use the per-area docs below as a reference while reading or modifying specific code.

- [`architecture.md`](./architecture.md) — high-level architecture: entry points, global state,
  component tree, the resume-tailoring data flow, LaTeX rendering constraints, and a guide for
  adding a new AI provider.
- [`entry-points.md`](./entry-points.md) — `src/main.tsx`, `src/App.tsx` (route table), and the
  hand-written `latex.js` ambient type declaration (`src/latex-js.d.ts`).
- [`types.md`](./types.md) — `src/types.ts`: `ThemeMode`, `Provider`, `ModelOption`,
  `ProviderInfo`, the `PROVIDERS` catalog, and `getProviderInfo`.
- [`context.md`](./context.md) — `src/context/AppContext.tsx`: the `AppProvider` component,
  `useAppContext()` hook, the full `AppContextValue` shape, and the persistence/opt-out behavior
  backing it.
- [`components.md`](./components.md) — every component in `src/components/` (`layout/`,
  `optimizer/`, `editor/`, `shared/`): props, local state, and behavior.
- [`lib.md`](./lib.md) — non-provider `src/lib/` modules: `storage.ts` (localStorage wrapper),
  `latexCompiler.ts` (LaTeX → HTML rendering), `latexEditorExtensions.ts` (CodeMirror LaTeX
  highlighting), and `defaultResume.ts` (starter template).
- [`providers.md`](./providers.md) — `src/lib/providers/`: the shared prompt/plumbing
  (`shared.ts`), the lazy-loading dispatcher (`index.ts`), and each of the four provider
  implementations (`anthropic.ts`, `openai.ts`, `google.ts`, `groq.ts`).

## Coverage

Every file under `src/` is documented in one of the files above:

| Source | Doc |
|---|---|
| `src/main.tsx`, `src/App.tsx`, `src/latex-js.d.ts` | `entry-points.md` |
| `src/types.ts` | `types.md` |
| `src/context/AppContext.tsx` | `context.md` |
| `src/components/layout/*` | `components.md` |
| `src/components/optimizer/*` | `components.md` |
| `src/components/editor/*` | `components.md` |
| `src/components/shared/*` | `components.md` |
| `src/lib/storage.ts`, `latexCompiler.ts`, `latexEditorExtensions.ts`, `defaultResume.ts` | `lib.md` |
| `src/lib/providers/*` | `providers.md` |
| `src/index.css` | not separately documented — global Tailwind entry stylesheet, no exports |
