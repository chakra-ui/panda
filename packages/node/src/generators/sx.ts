import { outdent } from 'outdent'

export function generateSx() {
  return {
    js: outdent`
    export const sx = (styles) => styles
    `,
    dts: outdent`
    import { CssObject } from '../types'
    export declare function sx(styles: CssObject): any
    `,
  }
}
