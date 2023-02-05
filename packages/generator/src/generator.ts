import type { LoadConfigResult } from '@pandacss/types'
import { Obj, pipe } from 'lil-fp'
import { generateArtifacts } from './artifacts'
import { generateFlattenedCss } from './artifacts/css/flat-css'
import { generateParserCss } from './artifacts/css/parser-css'
import { getEngine } from './engines'
import { getMessages } from './messages'

const defaults = (conf: LoadConfigResult): LoadConfigResult => ({
  ...conf,
  config: {
    cssVarRoot: ':where(:root, :host)',
    jsxFactory: 'panda',
    outExtension: 'mjs',
    ...conf.config,
  },
})

export const createGenerator = (conf: LoadConfigResult) =>
  pipe(
    getEngine(defaults(conf)),
    Obj.assign((ctx) => ({
      getArtifacts: generateArtifacts(ctx),
      getCss: generateFlattenedCss(ctx),
      getParserCss: generateParserCss(ctx),
      messages: getMessages(ctx),
    })),
  )

export type Generator = ReturnType<typeof createGenerator>
