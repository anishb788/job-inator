import { useEffect, useRef, useState } from 'react'
import { renderLatex } from '../../lib/latexCompiler'

interface PdfPreviewPanelProps {
  latexSource: string
  fileName?: string
}

interface RenderError {
  message: string
  line?: number
  column?: number
}

export function PdfPreviewPanel({ latexSource, fileName = 'resume' }: PdfPreviewPanelProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<RenderError | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    function compile() {
      if (!latexSource.trim()) {
        setHtml(null)
        setError({ message: 'Nothing to preview yet.' })
        return
      }
      const result = renderLatex(latexSource)
      if (result.ok) {
        setHtml(result.html)
        setError(null)
      } else {
        setHtml(null)
        setError({ message: result.message, line: result.line, column: result.column })
      }
    }

    // Render immediately on mount / first prop value; debounce subsequent
    // rapid edits (e.g. typing in the LaTeX editor) so we don't re-render on
    // every keystroke.
    if (isFirstRender.current) {
      isFirstRender.current = false
      compile()
      return
    }

    const timer = setTimeout(compile, 300)
    return () => clearTimeout(timer)
  }, [latexSource])

  /**
   * Rasterizes the rendered preview (the `.page` element inside the iframe,
   * or the whole body as a fallback) to a canvas via html2canvas, then embeds
   * that single image into a one-page US Letter PDF via jsPDF, scaled to fit
   * and centered horizontally. Both libraries are dynamically imported so
   * they're only pulled into the bundle when a download is actually requested.
   */
  async function handleDownload() {
    const iframeDoc = iframeRef.current?.contentDocument
    if (!iframeDoc?.body) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const target = (iframeDoc.querySelector('.page') as HTMLElement | null) ?? iframeDoc.body
      const canvas = await html2canvas(target, { scale: 2, backgroundColor: '#ffffff' })

      const pdf = new jsPDF({ unit: 'pt', format: 'letter' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgRatio = canvas.height / canvas.width

      let renderWidth = pageWidth
      let renderHeight = pageWidth * imgRatio
      if (renderHeight > pageHeight) {
        renderHeight = pageHeight
        renderWidth = pageHeight / imgRatio
      }
      const x = (pageWidth - renderWidth) / 2

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, 0, renderWidth, renderHeight)
      pdf.save(`${fileName}.pdf`)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Failed to generate PDF.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">PDF Preview</h2>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!html || downloading}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading ? 'Preparing PDF…' : 'Download PDF'}
        </button>
      </div>

      {downloadError && <p className="text-xs text-red-600 dark:text-red-400">{downloadError}</p>}

      <div className="min-h-[400px] flex-1 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
        {html ? (
          <iframe ref={iframeRef} title="Resume PDF preview" srcDoc={html} className="pdf-frame" />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {error?.message ?? 'Compiling…'}
              </p>
              {error?.line !== undefined && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Line {error.line}
                  {error.column !== undefined ? `, column ${error.column}` : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
