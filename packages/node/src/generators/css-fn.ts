import { outdent } from 'outdent'
import type { PandaContext } from '../context'

const stringify = (v: any) => JSON.stringify(Object.fromEntries(v), null, 2)

export function generateCssFn(ctx: PandaContext) {
  const { utility, hash } = ctx
  const { separator } = utility

  return {
    dts: outdent`
    import { SystemStyleObject } from '../types'
    export declare function css(styles: SystemStyleObject): string
    `,
    js: outdent`
    import { createCss, withoutSpace } from "../helpers"
    import { sortConditions } from "./conditions"

    const classNameMap = ${stringify(utility.entries())}
    const shorthands = ${stringify(utility.shorthands)}

    const hasShorthand = ${utility.hasShorthand ? 'true' : 'false'}

    const resolveShorthand = (prop) => shorthands[prop] || prop

    function transform(prop, value) {
      let key = resolveShorthand(prop)
      let propKey = classNameMap[key] || prop
      let className = \`$\{propKey}${separator}$\{withoutSpace(value)}\`
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
