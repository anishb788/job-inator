import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { tailorResume, describeProviderError } from '../../lib/providers'
import { getProviderInfo } from '../../types'
import { JobDescriptionInput } from './JobDescriptionInput'
import { TailoredLatexPanel } from './TailoredLatexPanel'
import { PdfPreviewPanel } from '../shared/PdfPreviewPanel'

type Status = 'idle' | 'loading' | 'error' | 'done'

export function OptimizerPage() {
  const { provider, apiKey, model, resumeLatex, jobDescription, setJobDescription } =
    useAppContext()
  const [tailoredLatex, setTailoredLatex] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const providerLabel = getProviderInfo(provider).label
  const canOptimize = apiKey.trim().length > 0 && jobDescription.trim().length > 0 && status !== 'loading'

  async function handleOptimize() {
    setStatus('loading')
    setErrorMessage('')
    setTailoredLatex('')
    try {
      const result = await tailorResume(provider, {
        apiKey,
        model,
        jobDescription,
        resumeLatex,
        onDelta: (fullTextSoFar) => setTailoredLatex(fullTextSoFar),
      })
      setTailoredLatex(result)
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setErrorMessage(await describeProviderError(provider, err))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ATS Resume Optimizer</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Paste a job description below. {providerLabel} will tailor your base resume (edit it in
          the{' '}
          <Link to="/editor" className="text-indigo-600 underline dark:text-indigo-400">
            LaTeX Editor
          </Link>
          ) to match it, keeping everything truthful and ATS-friendly.
        </p>
      </div>

      {!apiKey.trim() && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          Add your {providerLabel} API key in Settings (gear icon, top right) before optimizing.
        </div>
      )}

      <JobDescriptionInput
        value={jobDescription}
        onChange={setJobDescription}
        disabled={status === 'loading'}
      />

      <div>
        <button
          type="button"
          onClick={handleOptimize}
          disabled={!canOptimize}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'loading' ? 'Optimizing…' : 'Optimize Resume'}
        </button>
      </div>

      {status === 'error' && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {(tailoredLatex || status === 'loading') && (
        <div className="grid gap-6 lg:grid-cols-2">
          <TailoredLatexPanel latex={tailoredLatex} streaming={status === 'loading'} />
          <PdfPreviewPanel latexSource={tailoredLatex} fileName="tailored-resume" />
        </div>
      )}
    </div>
  )
}
