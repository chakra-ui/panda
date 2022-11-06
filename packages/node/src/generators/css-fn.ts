import { outdent } from 'outdent'
import type { PandaContext } from '../context'

const stringify = (v: any) => JSON.stringify(Object.fromEntries(v), null, 2)

export function generateCssFn(ctx: PandaContext) {
  const { utility, hash } = ctx
  return {
    dts: outdent`
    import { CssObject } from '../types'
    export declare function css(styles: CssObject): string
    `,
    js: outdent`
    import { createCss } from "../helpers"
    import { sortConditions } from "./conditions"

    const withoutSpace = (v) => typeof v === "string" ? v.replaceAll(' ', '_') : v

    const classNameMap = ${stringify(utility.entries())}
    const shorthands = ${stringify(utility.shorthands)}

    const hasShorthand = ${utility.hasShorthand ? 'true' : 'false'}

    const resolveShorthand = (prop) => {
      return shorthands[prop] || prop
    }

    function transform(prop, value) {
      let key = resolveShorthand(prop)
      let propKey = classNameMap[key] || prop
      let className = \`$\{propKey}_$\{withoutSpace(value)}\`
      return { className }
    }

    const context = {
      transform,
      conditions: { shift: sortConditions },
      hash: ${hash ? 'true' : 'false'},
      hasShorthand,
      resolveShorthand,
    }

    export const css = createCss(context)
    `,
  }
}
