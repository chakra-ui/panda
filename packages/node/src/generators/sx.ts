import { outdent } from 'outdent'

export function generateSx() {
  return {
    js: outdent`
    export const sx = (styles) => styles
    `,
    dts: outdent`
    import { UserCssObject } from '../types/public'
    export declare function sx(styles: UserCssObject): any
    `,
  }
}
