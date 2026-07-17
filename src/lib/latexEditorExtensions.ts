import { StreamLanguage } from '@codemirror/language'
import { stex } from '@codemirror/legacy-modes/mode/stex'

/** Shared CodeMirror extensions for anywhere LaTeX source is shown (editor or read-only view). */
export const latexExtensions = [StreamLanguage.define(stex)]
