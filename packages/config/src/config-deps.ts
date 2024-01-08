import type { ArtifactId, ConfigPath } from '@pandacss/types'
import { createMatcher } from './create-matcher'

// Below is the list of all the config paths that can affect an artifact generation
// For some, such as recipes/patterns/jsx-patterns we'll specify which item was specifically affected (e.g. recipes.xxx-yyy)
// so we can avoid generating/re-writing all the other artifacts of the same kind (e.g. recipes.aaa, recipes.bbb, etc.) that didn't change

const all: ConfigPath[] = ['outdir', 'forceConsistentTypeExtension', 'outExtension']

const format: ConfigPath[] = ['syntax', 'hash', 'prefix', 'separator']

const tokens: ConfigPath[] = ['utilities', 'conditions', 'theme.tokens', 'theme.semanticTokens', 'theme.breakpoints']

const jsx: ConfigPath[] = ['jsxFramework', 'jsxFactory', 'jsxStyleProps', 'syntax']

const css: ConfigPath[] = ['layers', 'optimize', 'minify']

const common = tokens.concat(jsx, format)

const artifactConfigDeps: Record<ArtifactId, ConfigPath[]> = {
  helpers: ['syntax', 'jsxFramework'],
  keyframes: ['theme.keyframes', 'layers'],
  'design-tokens': ['layers', '!utilities.*.className'].concat(tokens),
  types: ['!utilities.*.className'].concat(common),
  'css-fn': common,
  cva: ['syntax'],
  sva: ['syntax'],
  cx: [],
  'create-recipe': ['separator', 'prefix', 'hash'],
  'recipes-index': ['theme.recipes', 'theme.slotRecipes'],
  recipes: ['theme.recipes', 'theme.slotRecipes'],
  'patterns-index': ['syntax', 'patterns'],
  patterns: ['syntax', 'patterns'],
  'jsx-is-valid-prop': common,
  'jsx-factory': jsx,
  'jsx-helpers': jsx,
  'jsx-patterns': jsx.concat('patterns'),
  'jsx-patterns-index': jsx.concat('patterns'),
  'css-index': ['syntax'],
  'reset.css': ['preflight', 'layers'],
  'global.css': ['globalCss'].concat(css),
  'static.css': ['staticCss', 'theme.breakpoints'].concat(css),
  'styles.css': tokens.concat(format),
  'package.json': ['emitPackage'],
}

// Prepare a list of regex that resolves to an artifact id from a list of config paths
export const artifactMatchers = Object.entries(artifactConfigDeps).map(([key, paths]) => {
  if (!paths.length) return () => undefined
  return createMatcher(key, paths.concat(all))
})
