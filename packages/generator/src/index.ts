import { getStaticCss } from '@pandacss/core'
import type { UserConfig } from '@pandacss/types'
import { Obj, pipe } from 'lil-fp'
import { getEngine } from './engines'
import { getGlobalCss } from './global-css'
import { getParserCss } from './parser-css'

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
    Obj.assign({
      getStaticCss,
      getGlobalCss,
      getParserCss,
    }),
  )
