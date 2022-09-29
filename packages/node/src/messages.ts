import { colors, quote } from '@css-panda/logger'
import { outdent } from 'outdent'
import type { PandaContext } from './context'

const tick = colors.green().bold('✔️')

export function emitComplete(ctx: PandaContext) {
  return [
    outdent`
      We have generated the panda system for you:

      ${tick} ${quote(ctx.outdir, '/css')}: the css function to author styles
    `,
    ctx.hasTokens &&
      outdent`
      ${tick} ${quote(ctx.outdir, '/design-tokens')}: the css variables and js function to query your tokens
    `,
    ctx.hasRecipes &&
      outdent`
      ${tick} ${quote(ctx.outdir, '/patterns')}: functions to implement common css patterns
    `,
    ctx.hasPattern &&
      outdent`
      ${tick} ${quote(ctx.outdir, '/recipes')}: functions to create multi-variant styles
    `,
    ctx.jsx &&
      outdent`
      ${tick} ${quote(ctx.outdir, '/jsx')}: style prop powered elements for ${ctx.jsxFramework}
    `,
  ]
    .filter(Boolean)
    .join('\n')
}
