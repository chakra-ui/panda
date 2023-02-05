import type { UserConfig } from '@pandacss/types'
import { Obj, pipe } from 'lil-fp'
import { generateArtifacts } from './artifacts'
import { generateFlattenedCss } from './artifacts/css/flat-css'
import { generateParserCss } from './artifacts/css/parser-css'
import { getEngine } from './engines'

const defaults = (config: UserConfig): UserConfig => ({
  cssVarRoot: ':where(:root, :host)',
  jsxFactory: 'panda',
  outExtension: 'mjs',
  ...config,
})

export const createGenerator = (conf: UserConfig) =>
  pipe(
    defaults(conf),
    getEngine,
    Obj.bind('getParserCss', generateParserCss),
    Obj.bind('getArtifacts', generateArtifacts),
    Obj.bind('getCss', generateFlattenedCss),
  )
