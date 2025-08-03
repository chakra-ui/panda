import type { Context } from '@pandacss/core'
import type { ArtifactFilters, JsxFramework } from '@pandacss/types'
import {
  generatePreactJsxFactory,
  generatePreactJsxPattern,
  generatePreactJsxTypes,
  generatePreactCreateStyleContext,
} from './preact-jsx'
import { generatePreactJsxStringLiteralFactory } from './preact-jsx/jsx.string-literal'
import { generatePreactJsxStringLiteralTypes } from './preact-jsx/types.string-literal'
import { generateQwikJsxFactory, generateQwikJsxPattern, generateQwikJsxTypes } from './qwik-jsx'
import { generateQwikJsxStringLiteralFactory } from './qwik-jsx/jsx.string-literal'
import { generateQwikJsxStringLiteralTypes } from './qwik-jsx/types.string-literal'
import {
  generateReactJsxFactory,
  generateReactJsxPattern,
  generateReactJsxTypes,
  generateReactCreateStyleContext,
} from './react-jsx'
import { generateReactJsxStringLiteralFactory } from './react-jsx/jsx.string-literal'
import { generateReactJsxStringLiteralTypes } from './react-jsx/types.string-literal'
import {
  generateSolidJsxFactory,
  generateSolidJsxPattern,
  generateSolidJsxTypes,
  generateSolidCreateStyleContext,
} from './solid-jsx'
import { generateSolidJsxStringLiteralFactory } from './solid-jsx/jsx.string-literal'
import { generateSolidJsxStringLiteralTypes } from './solid-jsx/types.string-literal'
import {
  generateVueJsxFactory,
  generateVueJsxPattern,
  generateVueJsxTypes,
  generateVueCreateStyleContext,
} from './vue-jsx'
import { generateVueJsxStringLiteralFactory } from './vue-jsx/jsx.string-literal'
import { generateVueJsxStringLiteralTypes } from './vue-jsx/types.string-literal'

/* -----------------------------------------------------------------------------
 * JSX Types
 * -----------------------------------------------------------------------------*/

const typesMap = {
  react: generateReactJsxTypes,
  preact: generatePreactJsxTypes,
  solid: generateSolidJsxTypes,
  vue: generateVueJsxTypes,
  qwik: generateQwikJsxTypes,
}

const typesStringLiteralMap = {
  react: generateReactJsxStringLiteralTypes,
  solid: generateSolidJsxStringLiteralTypes,
  qwik: generateQwikJsxStringLiteralTypes,
  preact: generatePreactJsxStringLiteralTypes,
  vue: generateVueJsxStringLiteralTypes,
}

const isKnownFramework = (framework: string): framework is JsxFramework => Boolean((typesMap as any)[framework])

export function generateJsxTypes(ctx: Context) {
  if (!ctx.jsx.framework) return
  if (!isKnownFramework(ctx.jsx.framework)) return
  const type = ctx.isTemplateLiteralSyntax ? typesStringLiteralMap[ctx.jsx.framework] : typesMap[ctx.jsx.framework]
  return type?.(ctx)
}

/* -----------------------------------------------------------------------------
 * Factory JSX
 * -----------------------------------------------------------------------------*/

const factoryMap = {
  react: generateReactJsxFactory,
  solid: generateSolidJsxFactory,
  preact: generatePreactJsxFactory,
  vue: generateVueJsxFactory,
  qwik: generateQwikJsxFactory,
}

const factoryStringLiteralMap = {
  react: generateReactJsxStringLiteralFactory,
  solid: generateSolidJsxStringLiteralFactory,
  qwik: generateQwikJsxStringLiteralFactory,
  preact: generatePreactJsxStringLiteralFactory,
  vue: generateVueJsxStringLiteralFactory,
}

export function generateJsxFactory(ctx: Context) {
  if (!ctx.jsx.framework) return
  if (!isKnownFramework(ctx.jsx.framework)) return
  const factory = ctx.isTemplateLiteralSyntax
    ? factoryStringLiteralMap[ctx.jsx.framework]
    : factoryMap[ctx.jsx.framework]
  return factory?.(ctx)
}

/* -----------------------------------------------------------------------------
 * Pattern JSX
 * -----------------------------------------------------------------------------*/

const patternMap = {
  react: generateReactJsxPattern,
  solid: generateSolidJsxPattern,
  preact: generatePreactJsxPattern,
  vue: generateVueJsxPattern,
  qwik: generateQwikJsxPattern,
}

export function generateJsxPatterns(ctx: Context, filters?: ArtifactFilters) {
  if (ctx.isTemplateLiteralSyntax || ctx.patterns.isEmpty() || !ctx.jsx.framework) return []
  if (!isKnownFramework(ctx.jsx.framework)) return
  return patternMap[ctx.jsx.framework!](ctx, filters)
}

/* -----------------------------------------------------------------------------
 * Create Style Context JSX
 * -----------------------------------------------------------------------------*/

const createStyleContextMap = {
  react: generateReactCreateStyleContext,
  preact: generatePreactCreateStyleContext,
  solid: generateSolidCreateStyleContext,
  vue: generateVueCreateStyleContext,
}

export function generateJsxCreateStyleContext(ctx: Context) {
  if (ctx.isTemplateLiteralSyntax || !ctx.jsx.framework) return
  if (!isKnownFramework(ctx.jsx.framework)) return
  const generator = (createStyleContextMap as any)[ctx.jsx.framework]
  return generator?.(ctx)
}
