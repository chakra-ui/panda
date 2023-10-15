import type { ConfigResultWithHooks, OutdirImportMap, TSConfig } from '@pandacss/types'
import { generateArtifacts } from './artifacts'
import { generateFlattenedCss } from './artifacts/css/flat-css'
import { generateParserCss, generateParserCssOld } from './artifacts/css/parser-css'
import { getEngine } from './engines'
import { getMessages } from './messages'
import { generateStaticCss } from './artifacts/css/static-css'
import { generateResetCss } from './artifacts/css/reset-css'
import { generateTokenCss } from './artifacts/css/token-css'
import { generateKeyframeCss } from './artifacts/css/keyframe-css'
import { generateGlobalCss } from './artifacts/css/global-css'

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

const getImportMap = (outdir: string, configImportMap?: OutdirImportMap) => ({
  css: configImportMap?.css ? [configImportMap.css] : [outdir, 'css'],
  recipe: configImportMap?.recipes ? [configImportMap.recipes] : [outdir, 'recipes'],
  pattern: configImportMap?.patterns ? [configImportMap.patterns] : [outdir, 'patterns'],
  jsx: configImportMap?.jsx ? [configImportMap.jsx] : [outdir, 'jsx'],
})

export const createGenerator = (conf: ConfigResultWithHooks) => {
  const ctx = getEngine(defaults(conf))
  const { config, jsx, isValidProperty, patterns, recipes, conditions } = ctx

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
      hash: config.hash,
      importMap: getImportMap(config.outdir.replace(relativeBaseUrl, ''), config.importMap),
      jsx: {
        framework: jsx.framework,
        factory: jsx.factoryName,
        styleProps: jsx.styleProps,
        nodes: [...patterns.details, ...recipes.details],
      },
      patternKeys: patterns.keys,
      recipeKeys: recipes.keys,
      syntax: config.syntax,
      getRecipesByJsxName: recipes.filter, // TODO rm
      getPatternsByJsxName: patterns.filter,
      isValidProperty,
      conditions,
      recipes,
      patterns,
      utility: ctx.utility,
      hashCollector: ctx.hashCollector,
      stylesCollector: ctx.stylesCollector,
      compilerOptions: compilerOptions as any,
      tsOptions: conf.tsOptions,
      join: (...paths: string[]) => paths.join('/'),
    },
  }
}

export type Generator = ReturnType<typeof createGenerator>
