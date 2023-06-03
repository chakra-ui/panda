import type { Context } from '../engines'
import { generatePreactJsxFactory, generatePreactJsxPattern, generatePreactJsxTypes } from './preact-jsx'
import { generateQwikJsxFactory, generateQwikJsxPattern, generateQwikJsxTypes } from './qwik-jsx'
import { generateReactJsxFactory, generateReactJsxPattern, generateReactJsxTypes } from './react-jsx'
import { generateSolidJsxFactory, generateSolidJsxPattern, generateSolidJsxTypes } from './solid-jsx'
import { generateVueJsxFactory } from './vue-jsx/jsx'
import { generateVueJsxPattern } from './vue-jsx/pattern'
import { generateVueJsxTypes } from './vue-jsx/types'

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

export function generateJsxTypes(ctx: Context) {
  if (!ctx.jsx.framework) return
  return typesMap[ctx.jsx.framework](ctx)
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

export function generateJsxFactory(ctx: Context) {
  if (!ctx.jsx.framework) return
  return factoryMap[ctx.jsx.framework](ctx)
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

export function generateJsxPatterns(ctx: Context) {
  if (ctx.patterns.isEmpty() && !ctx.jsx.framework) return []
  return patternMap[ctx.jsx.framework!](ctx)
}
