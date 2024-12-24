declare module 'wordwrapjs' {
  export interface WordwrapOptions {
    width?: number
    eol?: string
  }

  export default class Wordwrap {
    constructor(text: string, options?: WordwrapOptions)
    static wrap(text: string, options?: WordwrapOptions): string
    static lines(text: string, options?: WordwrapOptions): string[]
    static isWrappable(text?: string): boolean
    static getChunks(text: string): string[]
  }
}
