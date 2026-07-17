# Job-Inator Architecture

Job-Inator is a client-side React + TypeScript + Vite single-page app. There is no backend —
all state lives in the browser (React context + optional localStorage), and resume tailoring
is done by calling an AI provider's SDK directly from the browser using the user's own API key.

## Entry points

- `src/main.tsx` — mounts `<App />` into `#root` inside `<StrictMode>`.
- `src/App.tsx` — wraps the app in `AppProvider` (global state) and `BrowserRouter`, and defines
  the two routes rendered inside `AppShell`:
  - `/` → `OptimizerPage`
  - `/editor` → `LatexEditorPage`

## Global state: `src/context/AppContext.tsx`

`AppProvider` is the single source of truth for all cross-page state, exposed via the
`useAppContext()` hook:

- `theme` (`'light' | 'dark'`)
- `provider` / `apiKey` / `model` — the selected AI provider and its per-provider API key and
  model (each provider keeps its own key/model in a `Record<Provider, string>`, so switching
  providers doesn't lose previously entered values)
- `resumeLatex` — the base resume LaTeX source (defaults to `DEFAULT_RESUME_LATEX`)
- `jobDescription` — the last-entered job description text
- `persistData` — whether the above is mirrored to `localStorage`

State is backed by `usePersistentState`, a `useState` variant that reads/writes through
`src/lib/storage.ts` only when `persistData` is `true`. Turning `persistData` off both stops
future writes and immediately deletes everything previously saved under
`PERSISTABLE_KEYS` (theme, provider, API keys, models, resume source, job description) — the
"Save my data in this browser" toggle in Settings maps directly to this flag.

## Pages and components

```
src/
  App.tsx                        route table
  context/AppContext.tsx         global state (see above)
  components/
    layout/
      AppShell.tsx                header/nav + <Outlet/> + settings gear button
      SettingsDrawer.tsx           theme, provider, model, API key, persistence toggle
    optimizer/
      OptimizerPage.tsx            main "/" screen — orchestrates tailoring
      JobDescriptionInput.tsx      controlled textarea for the job description
      TailoredLatexPanel.tsx       read-only CodeMirror view of the AI output + copy button
    editor/
      LatexEditorPage.tsx          "/editor" screen — edit/save the base resume LaTeX
    shared/
      PdfPreviewPanel.tsx          renders LaTeX -> HTML -> iframe preview, and HTML -> PDF download
  lib/
    providers/                     one module per AI provider + shared prompt/plumbing
    latexCompiler.ts               LaTeX source -> HTML via latex.js
    latexEditorExtensions.ts       shared CodeMirror LaTeX syntax highlighting
    storage.ts                     typed localStorage wrapper
    defaultResume.ts               starter resume LaTeX template
  types.ts                         Provider/theme types + the PROVIDERS model catalog
```

### `AppShell`

Renders the header (logo, "LaTeX Editor" nav link, settings gear) and an `<Outlet />` for the
active route, plus the `SettingsDrawer` (a slide-over panel toggled by local `useState`, not
routed).

### `OptimizerPage` (`/`)

Reads `provider`, `apiKey`, `model`, `resumeLatex`, `jobDescription` from `AppContext`.
`handleOptimize` calls `tailorResume(provider, opts)` from `lib/providers`, passing an `onDelta`
callback that updates `tailoredLatex` on every streamed chunk (so `TailoredLatexPanel` and
`PdfPreviewPanel` update live as the model generates). On failure, the thrown error is passed to
`describeProviderError(provider, err)` to produce a user-facing message. The Optimize button is
disabled unless an API key and job description are both present and no request is in flight.

### `LatexEditorPage` (`/editor`)

Holds a local `draft` string seeded from `resumeLatex`; "Save as base resume" commits `draft` to
`AppContext` (and, if persistence is on, to `localStorage`); "Reset to default template" replaces
`draft` with `DEFAULT_RESUME_LATEX` (does not save until the user clicks Save).

### `PdfPreviewPanel` (shared by both pages)

Given `latexSource`, debounces recompilation (300ms, skipped on first mount) via
`renderLatex()` from `lib/latexCompiler.ts`, and renders the resulting HTML inside a sandboxed
`<iframe srcDoc>`. "Download PDF" dynamically imports `html2canvas` and `jspdf`, rasterizes the
iframe's `.page` element to a canvas, and embeds that image into a single-page US Letter PDF
(scaled to fit and centered).

## Resume tailoring data flow

1. User writes/edits their base resume in `LatexEditorPage` → saved to `AppContext.resumeLatex`
   (and localStorage, if enabled).
2. User pastes a job description in `OptimizerPage` → `AppContext.jobDescription`.
3. User clicks "Optimize Resume" → `OptimizerPage.handleOptimize()` calls
   `tailorResume(provider, { apiKey, model, jobDescription, resumeLatex, onDelta })`.
4. `lib/providers/index.ts` lazy-loads only the selected provider's module
   (`anthropic.ts` / `openai.ts` / `google.ts` / `groq.ts`) and delegates to its
   `tailorResume(opts)`.
5. Each provider module calls its SDK directly from the browser (`dangerouslyAllowBrowser: true`
   for the Node-style SDKs) with a shared `SYSTEM_PROMPT` (in `lib/providers/shared.ts`) that
   instructs the model to: extract keywords from the job description, truthfully rewrite/reorder
   the resume to match without fabricating experience, and restrict output to the LaTeX subset
   `latex.js` can render (no packages, no `\newcommand`, no `\hfill`/`\rule`, etc.).
6. Streamed response chunks are accumulated and passed to `onDelta` for live UI updates; the
   final text has any markdown code fences stripped (`stripCodeFences`) before being returned.
7. The returned LaTeX is rendered live by `PdfPreviewPanel` via the same `latex.js` pipeline used
   for the editor, and can be downloaded as a PDF or copied via `TailoredLatexPanel`.

## LaTeX rendering constraints

There is no in-browser WASM TeX engine used here. `src/lib/latexCompiler.ts` uses `latex.js` (a
LaTeX-to-HTML5 translator) to parse and render LaTeX source into an HTML document, styled with
`public/latexjs/base.css` and `public/latexjs/article.css`. This only supports a standard subset
of `article`-class LaTeX (sections, itemize, textbf/textit, center blocks, `\\` line breaks) —
no arbitrary packages, `\newcommand`/`\renewcommand`, `\hfill`, or `\rule`. `DEFAULT_RESUME_LATEX`
(`src/lib/defaultResume.ts`) and the tailoring `SYSTEM_PROMPT`
(`src/lib/providers/shared.ts`) are both deliberately restricted to this supported subset so that
both the starter template and AI-tailored output render correctly. Parse errors surface line/column
info (when available) in `PdfPreviewPanel`.

## Adding a new AI provider

1. Add the provider to `Provider` and `PROVIDERS` in `src/types.ts` (id, label, key placeholder/
   help text, model list, default model).
2. Create `src/lib/providers/<id>.ts` exporting:
   - `tailorResume(opts: TailorResumeOptions): Promise<string>` — call the provider's SDK with
     `SYSTEM_PROMPT` + `buildUserMessage(...)` from `shared.ts`, stream deltas through
     `opts.onDelta`, and return `stripCodeFences(fullText)`.
   - `describeError(err: unknown): string` — map SDK-specific error types to user-facing
     messages, falling back to `describeFallbackError(err, providerLabel)`.
3. Register the module in the `LOADERS` map in `src/lib/providers/index.ts`.

## Persistence and security

All persisted state is namespaced under the `job-inator:` prefix in `localStorage` (see
`STORAGE_KEYS` in `src/lib/storage.ts`). No data leaves the browser except the direct API call to
the user's selected provider when they click "Optimize" — see `README.md`'s "Security note" for
the user-facing version of this.
