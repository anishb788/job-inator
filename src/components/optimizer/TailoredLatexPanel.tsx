import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { useAppContext } from '../../context/AppContext'
import { latexExtensions } from '../../lib/latexEditorExtensions'

interface TailoredLatexPanelProps {
  latex: string
  streaming: boolean
}

export function TailoredLatexPanel({ latex, streaming }: TailoredLatexPanelProps) {
  const { theme } = useAppContext()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(latex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Tailored LaTeX {streaming && <span className="text-indigo-500">(generating…)</span>}
        </h2>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!latex}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="min-h-[400px] flex-1 overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
        <CodeMirror
          value={latex}
          height="100%"
          theme={theme === 'dark' ? 'dark' : 'light'}
          extensions={latexExtensions}
          editable={false}
          basicSetup={{ lineNumbers: true, foldGutter: false }}
        />
      </div>
    </div>
  )
}
