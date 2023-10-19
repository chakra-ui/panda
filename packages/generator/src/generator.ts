import type { Artifact, ConfigResultWithHooks, OutdirImportMap, ParserResultType, TSConfig } from '@pandacss/types'
import { generateArtifacts } from './artifacts'
import { generateFlattenedCss, type FlattenedCssOptions } from './artifacts/css/flat-css'
import { generateParserCss } from './artifacts/css/parser-css'
import { getEngine, type Context } from './engines'
import { getMessages } from './messages'
import { generateStaticCss } from './artifacts/css/static-css'
import { generateResetCss } from './artifacts/css/reset-css'
import { generateTokenCss } from './artifacts/css/token-css'
import { generateKeyframeCss } from './artifacts/css/keyframe-css'
import { generateGlobalCss } from './artifacts/css/global-css'
import type { PatternDetail } from './engines/pattern'
import type { RecipeNode } from '@pandacss/core'

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

const getImportMap = (outdir: string, configImportMap?: OutdirImportMap): InternalImportMap => ({
  css: configImportMap?.css ? [configImportMap.css] : [outdir, 'css'],
  recipe: configImportMap?.recipes ? [configImportMap.recipes] : [outdir, 'recipes'],
  pattern: configImportMap?.patterns ? [configImportMap.patterns] : [outdir, 'patterns'],
  jsx: configImportMap?.jsx ? [configImportMap.jsx] : [outdir, 'jsx'],
})

interface InternalImportMap {
  css: string[]
  recipe: string[]
  pattern: string[]
  jsx: string[]
}

export const createGenerator = (conf: ConfigResultWithHooks): Generator => {
  const ctx = getEngine(defaults(conf))
  const { config, jsx, isValidProperty, patterns, recipes } = ctx

  const compilerOptions = (conf.tsconfig as TSConfig)?.compilerOptions ?? {}
  const baseUrl = compilerOptions.baseUrl ?? ''

  const cwd = conf.config.cwd
  const relativeBaseUrl = baseUrl !== cwd ? baseUrl.replace(cwd, '').slice(1) : cwd

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
    parserOptions: {
      importMap: getImportMap(config.outdir.replace(relativeBaseUrl, ''), config.importMap),
      jsx: {
        framework: jsx.framework,
        factory: jsx.factoryName,
        styleProps: jsx.styleProps,
        isStyleProp: isValidProperty,
        nodes: [...patterns.details, ...recipes.details],
      },
      patternKeys: patterns.keys,
      recipeKeys: recipes.keys,
      getRecipesByJsxName: recipes.filter,
      getPatternsByJsxName: patterns.filter,
      compilerOptions: compilerOptions as any,
      tsOptions: conf.tsOptions,
    },
  }
}

interface JsxOptions {
  framework: Context['jsx']['framework']
  factory: Context['jsx']['factoryName']
  styleProps: Context['jsx']['styleProps']
  isStyleProp: Context['isValidProperty']
  nodes: Array<PatternDetail | RecipeNode>
}

export interface Generator extends Context {
  getArtifacts: () => Artifact[]
  getStaticCss: (ctx: Context) => string
  getResetCss: (ctx: Context) => string
  getTokenCss: (ctx: Context) => string
  getKeyframeCss: (ctx: Context) => string
  getGlobalCss: (ctx: Context) => string
  getCss: (options: FlattenedCssOptions) => string
  getParserCss: (result: ParserResultType) => string | undefined
  messages: ReturnType<typeof getMessages>
  parserOptions: {
    importMap: InternalImportMap
    jsx: JsxOptions
    patternKeys: Context['patterns']['keys']
    recipeKeys: Context['recipes']['keys']
    getRecipesByJsxName: Context['recipes']['filter']
    getPatternsByJsxName: Context['patterns']['filter']
    compilerOptions: TSConfig['compilerOptions']
    tsOptions: ConfigResultWithHooks['tsOptions']
  }
}
