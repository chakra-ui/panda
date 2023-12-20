import type { ConfigResultWithHooks, OutdirImportMap, TSConfig } from '@pandacss/types'
import type { Context } from './engines'
import type { PatternDetail } from './engines/pattern'
import type { RecipeNode } from '@pandacss/core'

const getImportMap = (outdir: string, configImportMap?: string | OutdirImportMap): ParserImportMap => {
  if (typeof configImportMap === 'string') {
    return {
      css: [configImportMap, 'css'],
      recipe: [configImportMap, 'recipes'],
      pattern: [configImportMap, 'patterns'],
      jsx: [configImportMap, 'jsx'],
    }
  }

  const { css, recipes, patterns, jsx } = configImportMap ?? {}

  return {
    css: css ? [css] : [outdir, 'css'],
    recipe: recipes ? [recipes] : [outdir, 'recipes'],
    pattern: patterns ? [patterns] : [outdir, 'patterns'],
    jsx: jsx ? [jsx] : [outdir, 'jsx'],
  }
}

export const getParserOptions = (ctx: Context): ParserOptions => {
  const { config, jsx, isValidProperty, patterns, recipes } = ctx

  const compilerOptions = ctx.conf.tsconfig?.compilerOptions ?? {}
  const baseUrl = compilerOptions.baseUrl ?? ''

  const cwd = config.cwd
  const relativeBaseUrl = baseUrl !== cwd ? baseUrl.replace(cwd, '').slice(1) : cwd

  return {
    hash: ctx.hash,
    importMap: getImportMap(config.outdir.replace(relativeBaseUrl, ''), config.importMap),
    jsx: {
      framework: jsx.framework,
      factory: jsx.factoryName,
      styleProps: jsx.styleProps,
      isStyleProp: isValidProperty,
      nodes: [...patterns.details, ...recipes.details],
    },
    syntax: config.syntax,
    isValidProperty,
    recipes,
    patterns,
    hashFactory: ctx.hashFactory,
    // styleCollector: ctx.styleCollector,
    compilerOptions: compilerOptions as any,
    tsOptions: ctx.conf.tsOptions,
    join: (...paths: string[]) => paths.join('/'),
  }
}

export interface ParserImportMap {
  css: string[]
  recipe: string[]
  pattern: string[]
  jsx: string[]
}

export interface ParserJsxOptions {
  framework: Context['jsx']['framework']
  factory: Context['jsx']['factoryName']
  styleProps: Context['jsx']['styleProps']
  isStyleProp: Context['isValidProperty']
  nodes: Array<PatternDetail | RecipeNode>
}

export interface ParserOptions {
  hash: Context['hash']
  importMap: ParserImportMap | string
  jsx: ParserJsxOptions
  syntax: Context['config']['syntax']
  isValidProperty: Context['isValidProperty']
  recipes: Context['recipes']
  patterns: Context['patterns']
  hashFactory: Context['hashFactory']
  // styleCollector: Context['styleCollector']
  join: (...paths: string[]) => string
  compilerOptions: TSConfig['compilerOptions']
  tsOptions: ConfigResultWithHooks['tsOptions']
}
