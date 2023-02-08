import type { Context } from '../engines'
import {
  generatePreactJsxFactory,
  generatePreactLayoutGrid,
  generatePreactJsxPattern,
  generatePreactJsxTypes,
} from './preact-jsx'
import {
  generateReactJsxFactory,
  generateReactLayoutGrid,
  generateReactJsxPattern,
  generateReactJsxTypes,
} from './react-jsx'
import {
  generateSolidJsxFactory,
  generateSolidLayoutGrid,
  generateSolidJsxPattern,
  generateSolidJsxTypes,
} from './solid-jsx'

/* -----------------------------------------------------------------------------
 * JSX Types
 * -----------------------------------------------------------------------------*/

const typesMap = {
  react: generateReactJsxTypes,
  preact: generatePreactJsxTypes,
  solid: generateSolidJsxTypes,
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
}

export function generateJsxPatterns(ctx: Context) {
  if (ctx.patterns.isEmpty() && !ctx.jsx.framework) return []
  return patternMap[ctx.jsx.framework!](ctx)
}

/* -----------------------------------------------------------------------------
 * Layout Grid
 * -----------------------------------------------------------------------------*/

const layoutGridMap = {
  react: generateReactLayoutGrid,
  preact: generatePreactLayoutGrid,
  solid: generateSolidLayoutGrid,
}

export function generateLayoutGrid(ctx: Context) {
  if (!ctx.jsx.framework) return
  return layoutGridMap[ctx.jsx.framework]()
}
