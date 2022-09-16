import outdent from 'outdent'

export function generateSerializer(hash?: boolean) {
  return {
    js: outdent`
    import { transform } from "./transform"
    import { createCss } from "../helpers"
    import { sortConditions } from "./conditions"

    const conditions = { shift: sortConditions }
    const context = ${hash ? '{ transform, conditions, hash: true }' : '{ transform, conditions }'}
      
    export const css = createCss(context)
    `,
    dts: outdent`
    import { CssObject } from '../types'
    export declare function css(styles: CssObject): string
    `,
  }
}
