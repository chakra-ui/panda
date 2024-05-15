import { ArtifactFile } from '../artifact'

export const cxJsArtifact = new ArtifactFile({
  id: 'css/cx.js',
  fileName: 'cx',
  type: 'js',
  dir: (ctx) => ctx.paths.css,
  dependencies: [],
  code() {
    return `
    function cx() {
      let str = '',
        i = 0,
        arg

      for (; i < arguments.length; ) {
        if ((arg = arguments[i++]) && typeof arg === 'string') {
          str && (str += ' ')
          str += arg
        }
      }
      return str
    }

    export { cx }
  `
  },
})

export const cxDtsArtifact = new ArtifactFile({
  id: 'css/cx.d.ts',
  fileName: 'cx',
  type: 'dts',
  dir: (ctx) => ctx.paths.css,
  dependencies: [],
  code() {
    return `
    type Argument = string | boolean | null | undefined

    /** Conditionally join classNames into a single string */
    export declare function cx(...args: Argument[]): string
    `
  },
})
