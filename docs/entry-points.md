# Entry points and ambient types

## `src/main.tsx`

App bootstrap. Imports `src/index.css` (global Tailwind styles) and mounts `<App />` into
`document.getElementById('root')` inside `<StrictMode>` via `react-dom/client`'s `createRoot`.

## `src/App.tsx`

```tsx
function App(): JSX.Element
export default App
```

Top-level component: wraps everything in `AppProvider` (global state, see `docs/context.md`) and
`BrowserRouter`, and declares the route table:

```tsx
<Route element={<AppShell />}>
  <Route path="/" element={<OptimizerPage />} />
  <Route path="/editor" element={<LatexEditorPage />} />
</Route>
```

`AppShell` is the shared layout route (header/nav + `<Outlet/>` + `SettingsDrawer`) for both
pages — see `docs/components.md`.

## `src/latex-js.d.ts`

Ambient module declaration for `latex.js`, which ships without its own TypeScript types. Declares
the subset of its API actually used by `src/lib/latexCompiler.ts`:

```ts
declare module 'latex.js' {
  interface HtmlGeneratorOptions {
    hyphenate?: boolean
    documentClass?: string
    styles?: string[]
  }
  class HtmlGenerator {
    constructor(options?: HtmlGeneratorOptions)
    domFragment(): DocumentFragment
    htmlDocument(baseURL?: string): Document
    stylesAndScripts(baseURL?: string): DocumentFragment
    documentTitle: string
    reset(): void
  }
  function parse(latex: string, options: { generator: HtmlGenerator }): HtmlGenerator
}
```

Note this is a hand-written, partial surface of the real `latex.js` API — only what
`latexCompiler.ts` calls (`parse`, `new HtmlGenerator(...)`, `.domFragment()`,
`.documentTitle`) is declared; `htmlDocument`, `stylesAndScripts`, and `reset` are declared but
not currently called anywhere in `src/`.
