import type { Context } from '@pandacss/core'
import type { ArtifactFilters, JsxFramework } from '@pandacss/types'
import { qwikJsx } from './qwik-jsx'
import { preactJsx } from './preact-jsx'
import { reactJsx } from './react-jsx'
import { solidJsx } from './solid-jsx'
import { vueJsx } from './vue-jsx'

/* -----------------------------------------------------------------------------
 * JSX Types
 * -----------------------------------------------------------------------------*/

const typesMap = {
  react: reactJsx.jsxTypes,
  preact: preactJsx.jsxTypes,
  solid: solidJsx.jsxTypes,
  vue: vueJsx.jsxTypes,
  qwik: qwikJsx.jsxTypes,
}

const typesStringLiteralMap = {
  react: reactJsx.stringLiteral.jsxTypes,
  solid: solidJsx.stringLiteral.jsxTypes,
  qwik: qwikJsx.stringLiteral.jsxTypes,
  preact: preactJsx.stringLiteral.jsxTypes,
  vue: vueJsx.stringLiteral.jsxTypes,
}

const isKnownFramework = (framework: string): framework is JsxFramework => Boolean((typesMap as any)[framework])

export function generateJsxTypes(ctx: Context) {
  if (!ctx.jsx.framework) return
  if (!isKnownFramework(ctx.jsx.framework)) return
  return ctx.isTemplateLiteralSyntax ? typesStringLiteralMap[ctx.jsx.framework] : typesMap[ctx.jsx.framework]
}

/* -----------------------------------------------------------------------------
 * Factory JSX
 * -----------------------------------------------------------------------------*/

const factoryMap = {
  react: reactJsx.jsxFactory,
  solid: solidJsx.jsxFactory,
  preact: preactJsx.jsxFactory,
  vue: vueJsx.jsxFactory,
  qwik: qwikJsx.jsxFactory,
}

const factoryStringLiteralMap = {
  react: reactJsx.stringLiteral.jsxFactory,
  solid: solidJsx.stringLiteral.jsxFactory,
  qwik: qwikJsx.stringLiteral.jsxFactory,
  preact: preactJsx.stringLiteral.jsxFactory,
  vue: vueJsx.stringLiteral.jsxFactory,
}

export function generateJsxFactory(ctx: Context) {
  if (!ctx.jsx.framework) return
  if (!isKnownFramework(ctx.jsx.framework)) return
  return ctx.isTemplateLiteralSyntax ? factoryStringLiteralMap[ctx.jsx.framework] : factoryMap[ctx.jsx.framework]
}

/* -----------------------------------------------------------------------------
 * Pattern JSX
 * -----------------------------------------------------------------------------*/

const patternMap = {
  react: reactJsx.generatePatterns,
  solid: solidJsx.generatePatterns,
  preact: preactJsx.generatePatterns,
  vue: vueJsx.generatePatterns,
  qwik: qwikJsx.generatePatterns,
}

export function generateJsxPatterns(ctx: Context, filters?: ArtifactFilters) {
  if (ctx.isTemplateLiteralSyntax || ctx.patterns.isEmpty() || !ctx.jsx.framework) return []
  if (!isKnownFramework(ctx.jsx.framework)) return
  return patternMap[ctx.jsx.framework!](ctx, filters)
}
