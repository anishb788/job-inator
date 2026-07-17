interface JobDescriptionInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function JobDescriptionInput({ value, onChange, disabled }: JobDescriptionInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="job-description" className="text-sm font-medium text-slate-700 dark:text-slate-200">
        Job description
      </label>
      <textarea
        id="job-description"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here…"
        rows={12}
        className="w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      <p className="text-xs text-slate-400 dark:text-slate-500">{value.length.toLocaleString()} characters</p>
    </div>
  )
}
