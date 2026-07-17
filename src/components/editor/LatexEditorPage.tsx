import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { useAppContext } from '../../context/AppContext'
import { latexExtensions } from '../../lib/latexEditorExtensions'
import { DEFAULT_RESUME_LATEX } from '../../lib/defaultResume'
import { PdfPreviewPanel } from '../shared/PdfPreviewPanel'

export function LatexEditorPage() {
  const { theme, resumeLatex, setResumeLatex } = useAppContext()
  const [draft, setDraft] = useState(resumeLatex)
  const [savedMessage, setSavedMessage] = useState(false)

  const isDirty = draft !== resumeLatex

  function handleSave() {
    setResumeLatex(draft)
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 1500)
  }

  function handleReset() {
    setDraft(DEFAULT_RESUME_LATEX)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">LaTeX Editor</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Edit your base resume here. Save it to use as the source the Optimizer tailors against a
          job description.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save as base resume
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Reset to default template
        </button>
        {savedMessage && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</span>}
        {isDirty && !savedMessage && (
          <span className="text-sm text-slate-400 dark:text-slate-500">Unsaved changes</span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-h-[500px] overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
          <CodeMirror
            value={draft}
            height="500px"
            theme={theme === 'dark' ? 'dark' : 'light'}
            extensions={latexExtensions}
            onChange={(value) => setDraft(value)}
            basicSetup={{ lineNumbers: true, foldGutter: true }}
          />
        </div>
        <PdfPreviewPanel latexSource={draft} fileName="resume" />
      </div>
    </div>
  )
}
