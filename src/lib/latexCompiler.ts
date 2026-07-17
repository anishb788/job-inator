import { parse, HtmlGenerator } from 'latex.js'

/**
 * Client-side LaTeX rendering.
 *
 * There is no reliable, pre-built WebAssembly pdfTeX engine published anywhere
 * that can safely be pulled into a browser app (the real SwiftLaTeX/TeX Live
 * WASM engines are only distributed as source that requires an Emscripten
 * build step). Instead we use `latex.js` — a real LaTeX-to-HTML5 translator —
 * to render the resume, and rasterize that rendered HTML to a PDF for
 * download. This runs 100% offline, entirely in the browser.
 *
 * Trade-off: this supports standard article-class resume LaTeX (sections,
 * bold/italic, itemize lists, \hfill, basic macros — exactly what the ATS
 * rules in the Optimizer prompt already push the output towards) but not
 * arbitrary LaTeX packages or exotic macros. If a resume uses something
 * `latex.js` doesn't understand, the compile error/log below will say so —
 * simplify the LaTeX (or run it through a full TeX distribution like
 * Overleaf for final, byte-perfect output) if that happens.
 */

export interface LatexRenderSuccess {
  ok: true
  /** Full standalone HTML document string, ready for an <iframe srcDoc>. */
  html: string
  title: string
}

export interface LatexRenderFailure {
  ok: false
  message: string
  line?: number
  column?: number
}

export type LatexRenderResult = LatexRenderSuccess | LatexRenderFailure

interface PegLikeError {
  message?: string
  location?: { start?: { line?: number; column?: number } }
}

export function renderLatex(source: string): LatexRenderResult {
  try {
    const generator = new HtmlGenerator({ hyphenate: false })
    const doc = parse(source, { generator })

    const container = document.createElement('div')
    container.appendChild(doc.domFragment())

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="stylesheet" href="/latexjs/base.css" />
<link rel="stylesheet" href="/latexjs/article.css" />
<style>
  html, body { margin: 0; }
  body { padding: 36px 48px; background: #ffffff; }
  .page { max-width: 800px; margin: 0 auto; }
</style>
</head>
<body>
<div class="page">${container.innerHTML}</div>
</body>
</html>`

    return { ok: true, html, title: doc.documentTitle || 'Resume' }
  } catch (err) {
    const pegError = err as PegLikeError
    return {
      ok: false,
      message: pegError?.message ?? String(err),
      line: pegError?.location?.start?.line,
      column: pegError?.location?.start?.column,
    }
  }
}
