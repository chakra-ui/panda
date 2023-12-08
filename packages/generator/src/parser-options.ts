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
  const { tsconfig, tsOptions } = ctx.conf

  const compilerOptions = tsconfig?.compilerOptions ?? {}
  const baseUrl = compilerOptions.baseUrl ?? ''

  const cwd = config.cwd
  const relativeBaseUrl = baseUrl !== cwd ? baseUrl.replace(cwd, '').slice(1) : cwd

  return {
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
    tsOptions: tsOptions,
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
  importMap: ParserImportMap
  jsx: ParserJsxOptions
  patternKeys: Context['patterns']['keys']
  recipeKeys: Context['recipes']['keys']
  getRecipesByJsxName: Context['recipes']['filter']
  getPatternsByJsxName: Context['patterns']['filter']
  compilerOptions: TSConfig['compilerOptions']
  tsOptions: ConfigResultWithHooks['tsOptions']
}
