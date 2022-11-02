import { colors, quote } from '@css-panda/logger'
import { outdent } from 'outdent'
import { cliBox } from './cli-box'
import type { PandaContext } from './context'

const tick = colors.green().bold('✔️')

export function artifactsGeneratedMessage(ctx: PandaContext) {
  return [
    outdent`
      ${tick} ${quote(ctx.outdir, '/css')}: the css function to author styles
    `,
    ctx.hasTokens &&
      outdent`
      ${tick} ${quote(ctx.outdir, '/tokens')}: the css variables and js function to query your tokens
    `,
    ctx.hasPattern &&
      outdent`
      ${tick} ${quote(ctx.outdir, '/patterns')}: functions to implement common css patterns
    `,
    ctx.hasRecipes &&
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

const randomWords = ['Sweet', 'Divine', 'Pandalicious', 'Super']
const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

export function scaffoldCompleteMessage() {
  return cliBox(
    outdent`

  ${colors.bold().cyan('Next steps:')}
  
  ◆ Create a ${quote('index.css')} file in your project that contains:
  
  @layer reset, base, tokens, recipes, utilities;

  ◆ Import the ${quote('index.css')} file at the root of your project.

  `,
    `🐼 ${pickRandom(randomWords)}! ✨`,
  )
}

export function noExtractMesssage() {
  return outdent`
  No style object or props were detected in your source files.
  If this is unexpected, double-check the \`include\` options in your Panda config\n
`
}
