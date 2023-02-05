import { colors, logger, quote } from '@pandacss/logger'
import { outdent } from 'outdent'
import type { Context } from './engines'

const tick = colors.green().bold('✔️')

export const artifactsGenerated = (ctx: Context) => {
  const {
    config: { outdir },
    recipes,
    patterns,
    tokens,
    jsx,
  } = ctx

  return () =>
    [
      outdent`
    ${tick} ${quote(outdir, '/css')}: the css function to author styles
    `,
      !tokens.isEmpty &&
        outdent`
    ${tick} ${quote(outdir, '/tokens')}: the css variables and js function to query your tokens
    `,
      !patterns.isEmpty() &&
        outdent`
    ${tick} ${quote(outdir, '/patterns')}: functions to implement common css patterns
    `,
      !recipes.isEmpty() &&
        outdent`
      ${tick} ${quote(outdir, '/recipes')}: functions to create multi-variant styles
      `,
      jsx.framework &&
        outdent`
      ${tick} ${quote(outdir, '/jsx')}: style prop powered elements for ${jsx.framework}
      `,
      '\n',
    ]
      .filter(Boolean)
      .join('\n')
}

export const configExists = (cmd: string) => outdent`
      \n
      It looks like you already have panda created\`.
      
      You can now run ${quote(cmd, ' panda --watch')}.

      `

export const thankYou = () => outdent`

  🚀 Thanks for choosing ${colors.cyan('Panda')} to write your css.

  You are set up to start using Panda!

  `

const randomWords = ['Sweet', 'Divine', 'Pandalicious', 'Super']
const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

export const codegenComplete = () =>
  logger.box(
    outdent`

  ${colors.bold().cyan('Next steps:')}
  
  [1] Create a ${quote('index.css')} file in your project that contains:
  
      @layer reset, base, tokens, recipes, utilities;


  [2] Import the ${quote('index.css')} file at the root of your project.

  `,
    `🐼 ${pickRandom(randomWords)}! ✨`,
  )

export const noExtract = () =>
  outdent`
  No style object or props were detected in your source files.
  If this is unexpected, double-check the \`include\` options in your Panda config\n
`

export const watch = () =>
  outdent`
  Watching for file changes...
  `

export const buildComplete = (count: number) =>
  outdent`
  Successfully extracted css from ${count} file(s) ✨
  `

export const getMessages = (ctx: Context) => ({
  artifactsGenerated: artifactsGenerated(ctx),
  configExists,
  thankYou,
  codegenComplete,
  noExtract,
  watch,
  buildComplete,
})
