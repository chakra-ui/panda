import { colors, quote } from '@css-panda/logger'
import { outdent } from 'outdent'
import type { PandaContext } from './context'

const tick = colors.green().bold('✔️')

export function artifactsGeneratedMessage(ctx: PandaContext) {
  return [
    outdent`
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
    ctx.jsxFramework &&
      outdent`
      ${tick} ${quote(ctx.outdir, '/jsx')}: style prop powered elements for ${ctx.jsxFramework}
    `,
    '\n',
  ]
    .filter(Boolean)
    .join('\n')
}

export function configExistsMessage(cmd: string) {
  return outdent`
      \n
      It looks like you already have panda created\`.
      
      You can now run ${quote(cmd, ' panda --watch')}.

      `
}

export function thankYouMessage() {
  return outdent`

  🚀 Thanks for choosing ${colors.cyan('Panda')} to write your css.

  You are set up to start using Panda!

  `
}

export function scaffoldCompleteMessage() {
  return outdent`
  ----------------------------------------

  Next steps:
  
  - Create a ${quote('index.css')} file in your project that contains:
  
  :root {
    --panda: 1;
  }

  - Import the ${quote('index.css')} file at the root of your project.

  ----------------------------------------

  `
}
