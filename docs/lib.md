# `src/lib` (non-provider modules)

Utility modules used across components. AI provider integrations are documented separately in
`docs/providers.md`.

## `src/lib/storage.ts`

Thin, typed wrapper around `window.localStorage`. All reads/writes are wrapped in `try/catch` so
that unavailable storage (private browsing quota errors, disabled storage, etc.) degrades
silently rather than crashing the app.

### `readStorage<T>(key: string, fallback: T): T`

Reads `PREFIX + key` (`PREFIX` is `'job-inator:'`) from `localStorage` and `JSON.parse`s it.
Returns `fallback` if the key is absent or parsing/access fails.

### `writeStorage<T>(key: string, value: T): void`

`JSON.stringify`s `value` and writes it to `PREFIX + key`. Fails silently on error (see comment
in source: quota errors in private browsing, etc.).

### `removeStorage(key: string): void`

Deletes `PREFIX + key` from `localStorage`. Fails silently on error.

### `STORAGE_KEYS`

Const object of all the raw (unprefixed) keys used by the app: `theme`, `provider`, `apiKeys`
(stored as `'api-keys'`), `models`, `resumeLatex` (stored as `'resume-latex'`), `jobDescription`
(stored as `'job-description'`), `persistData` (stored as `'persist-data'`). Consumed by
`AppContext` to build `PERSISTABLE_KEYS`.

---

## `src/lib/latexCompiler.ts`

Client-side LaTeX-to-HTML rendering, used by `PdfPreviewPanel` for both the live preview and (via
rasterization) the PDF download. There is no WASM TeX engine involved — this uses
[`latex.js`](https://latex.js.org/), a LaTeX-to-HTML5 translator, which only supports a standard
subset of `article`-class LaTeX (see `docs/architecture.md`'s "LaTeX rendering constraints"
section for the full list of supported/unsupported constructs).

### Types

```ts
interface LatexRenderSuccess {
  ok: true
  html: string   // full standalone HTML document string, ready for an <iframe srcDoc>
  title: string  // doc.documentTitle, or 'Resume' if none was set
}

interface LatexRenderFailure {
  ok: false
  message: string
  line?: number
  column?: number
}

type LatexRenderResult = LatexRenderSuccess | LatexRenderFailure
```

### `renderLatex(source: string): LatexRenderResult`

Parses `source` with `latex.js`'s `parse()` + `HtmlGenerator` (hyphenation disabled), extracts the
resulting DOM fragment, and wraps it in a full HTML document string that links
`/latexjs/base.css` and `/latexjs/article.css` (served from `public/latexjs/`) plus a small inline
`<style>` block that centers a `.page` container (max-width 800px) with page padding. On a parse
error, catches it and returns `{ ok: false, message, line, column }`, pulling `line`/`column` out
of the error's `location.start` if the underlying error object has that shape (PEG.js-style parse
errors).

---

## `src/lib/latexEditorExtensions.ts`

```ts
export const latexExtensions: Extension[]
```

Shared CodeMirror 6 extension list — `StreamLanguage.define(stex)` from
`@codemirror/legacy-modes` — providing LaTeX syntax highlighting. Used by both `TailoredLatexPanel`
(read-only) and `LatexEditorPage` (editable) so the two CodeMirror instances stay visually
consistent.

---

## `src/lib/defaultResume.ts`

```ts
export const DEFAULT_RESUME_LATEX: string
```

The starter/reset-target resume LaTeX template (a single `String.raw` template literal containing
a complete `\documentclass[11pt]{article}` document for a fictional "Jane Doe"). Deliberately
restricted to the LaTeX subset `latex.js` supports (no `\newcommand`, no `\hfill`/`\rule`, no
third-party packages) — see the file's own header comment for the full rationale. Used as:
- The default value of `AppContext.resumeLatex` when nothing is in `localStorage`.
- The target of "Reset to default template" in `LatexEditorPage`.
