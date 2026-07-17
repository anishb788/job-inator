# `src/components/`

All React components, grouped by folder. All are function components; none accept children other
than where noted. Styling throughout uses Tailwind utility classes with `dark:` variants driven by
`AppContext.theme` (see `docs/context.md`).

## `layout/`

### `AppShell.tsx` — `AppShell()`

Route-level layout, mounted as the parent `element` for both routes in `App.tsx`. Renders:
- A header with the "Job-Inator" logo/home link, a "LaTeX Editor" `NavLink` (to `/editor`,
  styled active/inactive), and a settings gear `<button>`.
- `<Outlet />` for the active child route (`OptimizerPage` or `LatexEditorPage`).
- `SettingsDrawer`, toggled by local `useState<boolean>` (`settingsOpen`) — not routed, purely a
  local UI overlay.

Also defines a small local `GearIcon()` SVG component (not exported).

### `SettingsDrawer.tsx`

```ts
interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}
function SettingsDrawer({ open, onClose }: SettingsDrawerProps): JSX.Element | null
```

Slide-over panel (renders `null` when `open` is `false`) backed entirely by `useAppContext()`
state — it has no local persistence logic of its own. Sections:
- **Save my data in this browser** — toggle bound to `persistData`/`setPersistData`.
- **Appearance** — light/dark buttons bound to `theme`/`setTheme`.
- **AI provider** — a button grid over `PROVIDERS` (from `src/types.ts`), bound to
  `provider`/`setProvider`.
- **`{provider}` model** — a `<select>` over `getProviderInfo(provider).models`, bound to
  `model`/`setModel`, with the selected model's `hint` shown below it.
- **`{provider}` API key** — a password/text input (local `showKey` state toggles visibility)
  bound to `apiKey`/`setApiKey`, with `keyPlaceholder`/`keyHelpText` from `ProviderInfo`, plus a
  static security-disclosure paragraph that changes wording depending on `persistData`.

Clicking the backdrop (`<button aria-label="Close settings">` covering `inset-0`) calls `onClose`.

## `optimizer/`

### `OptimizerPage.tsx` — `OptimizerPage()`

The `/` route. Reads `provider`, `apiKey`, `model`, `resumeLatex`, `jobDescription`,
`setJobDescription` from `useAppContext()`. Local state: `tailoredLatex: string`, `status: 'idle'
| 'loading' | 'error' | 'done'`, `errorMessage: string`.

- `canOptimize` is `true` only when `apiKey` and `jobDescription` are both non-blank and
  `status !== 'loading'`.
- `handleOptimize()`: sets `status` to `'loading'`, clears `errorMessage`/`tailoredLatex`, calls
  `tailorResume(provider, { apiKey, model, jobDescription, resumeLatex, onDelta })` where
  `onDelta` sets `tailoredLatex` on every chunk (live streaming UI); on success sets `status` to
  `'done'`; on thrown error, sets `status` to `'error'` and populates `errorMessage` via
  `await describeProviderError(provider, err)`.
- Renders a warning banner if no API key is set, an inline error banner if `status === 'error'`,
  and — once there's any `tailoredLatex` or a request is in flight — a two-column grid pairing
  `TailoredLatexPanel` (left) with `PdfPreviewPanel` (right, `fileName="tailored-resume"`).

### `JobDescriptionInput.tsx`

```ts
interface JobDescriptionInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}
function JobDescriptionInput(props: JobDescriptionInputProps): JSX.Element
```

Controlled `<textarea>` (12 rows, resizable vertically) with a live character count below it.
Purely presentational — no internal state.

### `TailoredLatexPanel.tsx`

```ts
interface TailoredLatexPanelProps {
  latex: string
  streaming: boolean
}
function TailoredLatexPanel(props: TailoredLatexPanelProps): JSX.Element
```

Read-only CodeMirror view (`editable={false}`, `latexExtensions` from
`lib/latexEditorExtensions.ts`, theme synced to `useAppContext().theme`) of the AI-tailored
output, with a "generating…" label while `streaming` is true and a "Copy" button
(`navigator.clipboard.writeText`, disabled when `latex` is empty) that shows "Copied!" for 1.5s
via local `copied` state.

## `editor/`

### `LatexEditorPage.tsx` — `LatexEditorPage()`

The `/editor` route. Reads `theme`, `resumeLatex`, `setResumeLatex` from `useAppContext()`. Local
state: `draft: string` (seeded from `resumeLatex` at mount — **not** kept in sync with subsequent
external changes to `resumeLatex`), `savedMessage: boolean`.

- `isDirty = draft !== resumeLatex`.
- "Save as base resume" button (disabled unless `isDirty`): calls `setResumeLatex(draft)`,
  shows "Saved." for 1.5s.
- "Reset to default template" button: sets `draft` to `DEFAULT_RESUME_LATEX` — does **not**
  save to `AppContext`/localStorage until the user separately clicks Save.
- Renders an editable CodeMirror instance (`onChange` updates `draft`) beside a
  `PdfPreviewPanel` fed `latexSource={draft}` (i.e. the preview reflects unsaved edits live).

## `shared/`

### `PdfPreviewPanel.tsx`

```ts
interface PdfPreviewPanelProps {
  latexSource: string
  fileName?: string  // default: 'resume'
}
function PdfPreviewPanel(props: PdfPreviewPanelProps): JSX.Element
```

Used by both `OptimizerPage` (tailored output) and `LatexEditorPage` (draft resume). Local state:
`html: string | null`, `error: RenderError | null` (`{ message, line?, column? }`), `downloading:
boolean`, `downloadError: string | null`.

- **Compile effect**: on mount, compiles `latexSource` immediately via `renderLatex()` (from
  `lib/latexCompiler.ts`); on every subsequent `latexSource` change, debounces recompilation by
  300ms (so rapid typing in the LaTeX editor doesn't recompile on every keystroke) using a
  `isFirstRender` ref to distinguish the two cases. An empty/whitespace-only `latexSource` sets
  `error = { message: 'Nothing to preview yet.' }` without calling `renderLatex`.
- Renders the compiled HTML inside a sandboxed `<iframe srcDoc={html}>` when successful, or an
  error message (plus line/column if available) when not.
- **`handleDownload()`**: reads the iframe's `contentDocument`, dynamically imports `html2canvas`
  and `jspdf` (kept out of the main bundle until a download is actually requested), rasterizes the
  rendered `.page` element (or `<body>` as a fallback) to a canvas at `scale: 2` with a white
  background, then creates a single-page US Letter `jsPDF`, scales the rasterized image to fit
  the page (capping to page width or height, whichever constrains first) and centers it
  horizontally, and calls `pdf.save('${fileName}.pdf')`. Any thrown error is surfaced via
  `downloadError`.
