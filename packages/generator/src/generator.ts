import type { Artifact, ConfigResultWithHooks, ParserResultType } from '@pandacss/types'
import { generateArtifacts } from './artifacts'
import { generateFlattenedCss, type FlattenedCssOptions } from './artifacts/css/flat-css'
import { generateGlobalCss } from './artifacts/css/global-css'
import { generateKeyframeCss } from './artifacts/css/keyframe-css'
import { generateParserCss } from './artifacts/css/parser-css'
import { generateResetCss } from './artifacts/css/reset-css'
import { generateStaticCss } from './artifacts/css/static-css'
import { generateTokenCss } from './artifacts/css/token-css'
import { getEngine, type Context } from './engines'
import { getMessages } from './messages'
import { getParserOptions, type ParserOptions } from './parser-options'

const defaults = (conf: ConfigResultWithHooks): ConfigResultWithHooks => ({
  ...conf,
  config: {
    cssVarRoot: ':where(:root, :host)',
    jsxFactory: 'styled',
    jsxStyleProps: 'all',
    outExtension: 'mjs',
    shorthands: true,
    syntax: 'object-literal',
    ...conf.config,
    layers: {
      reset: 'reset',
      base: 'base',
      tokens: 'tokens',
      recipes: 'recipes',
      utilities: 'utilities',
      ...conf.config.layers,
    },
  },
})

export const createGenerator = (conf: ConfigResultWithHooks): Generator => {
  const ctx = getEngine(defaults(conf))
  const parserOptions = getParserOptions(ctx)

  return {
    ...ctx,
    getArtifacts: generateArtifacts(ctx),
    //
    getStaticCss: generateStaticCss,
    getResetCss: generateResetCss,
    getTokenCss: generateTokenCss,
    getKeyframeCss: generateKeyframeCss,
    getGlobalCss: generateGlobalCss,
    //
    getCss: generateFlattenedCss(ctx),
    getParserCss: generateParserCss(ctx),
    //
    messages: getMessages(ctx),
    parserOptions,
  }
}

export interface Generator extends Context {
  getArtifacts: (ids: string[] | undefined) => Artifact[]
  getStaticCss: (ctx: Context) => string
  getResetCss: (ctx: Context) => string
  getTokenCss: (ctx: Context) => string
  getKeyframeCss: (ctx: Context) => string
  getGlobalCss: (ctx: Context) => string
  getCss: (options: FlattenedCssOptions) => string
  getParserCss: (result: ParserResultType) => string | undefined
  messages: ReturnType<typeof getMessages>
  parserOptions: ParserOptions
}
