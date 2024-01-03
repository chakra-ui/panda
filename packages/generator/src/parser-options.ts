import type { PatternDetail, RecipeNode } from '@pandacss/core'
import type { ConfigResultWithHooks, TSConfig } from '@pandacss/types'
import type { Context } from './engines'
import { getImportMap, type ParserImportMap } from './import-map'

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
    encoder: ctx.encoder,
    compilerOptions: compilerOptions as any,
    tsOptions: ctx.conf.tsOptions,
    join: (...paths: string[]) => paths.join('/'),
  }
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
  encoder: Context['encoder']
  join: (...paths: string[]) => string
  compilerOptions: TSConfig['compilerOptions']
  tsOptions: ConfigResultWithHooks['tsOptions']
}
