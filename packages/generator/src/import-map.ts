import type { OutdirImportMap } from '@pandacss/types'

export const getImportMap = (outdir: string, configImportMap?: string | OutdirImportMap): ParserImportMap => {
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

export interface ParserImportMap {
  css: string[]
  recipe: string[]
  pattern: string[]
  jsx: string[]
}
