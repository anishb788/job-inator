declare module 'latex.js' {
  export interface HtmlGeneratorOptions {
    hyphenate?: boolean
    documentClass?: string
    styles?: string[]
  }

  export class HtmlGenerator {
    constructor(options?: HtmlGeneratorOptions)
    domFragment(): DocumentFragment
    htmlDocument(baseURL?: string): Document
    stylesAndScripts(baseURL?: string): DocumentFragment
    documentTitle: string
    reset(): void
  }

  export function parse(latex: string, options: { generator: HtmlGenerator }): HtmlGenerator
}
