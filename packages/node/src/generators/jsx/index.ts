import type { PandaContext } from '../../context'

import { generatePreactJsxFactory } from './preact-jsx'
import { generatePreactLayoutGrid } from './preact-layout-grid'
import { generatePreactJsxPattern } from './preact-pattern'
import { generatePreactJsxTypes } from './preact-types'

import { generateReactJsxFactory } from './react-jsx'
import { generateReactLayoutGrid } from './react-layout-grid'
import { generateReactJsxPattern } from './react-pattern'
import { generateReactJsxTypes } from './react-types'

import { generateSolidJsxFactory } from './solid-jsx'
import { generateSolidLayoutGrid } from './solid-layout-grid'
import { generateSolidJsxPattern } from './solid-pattern'
import { generateSolidJsxTypes } from './solid-types'

/* -----------------------------------------------------------------------------
 * JSX Types
 * -----------------------------------------------------------------------------*/

const typesMap = {
  react: generateReactJsxTypes,
  preact: generatePreactJsxTypes,
  solid: generateSolidJsxTypes,
}

export function generateJsxTypes(ctx: PandaContext) {
  if (!ctx.jsxFramework) return
  return typesMap[ctx.jsxFramework](ctx)
}

/* -----------------------------------------------------------------------------
 * Factory JSX
 * -----------------------------------------------------------------------------*/

const factoryMap = {
  react: generateReactJsxFactory,
  solid: generateSolidJsxFactory,
  preact: generatePreactJsxFactory,
}

export function generateJsxFactory(ctx: PandaContext) {
  return factoryMap[ctx.jsxFramework!](ctx)
}

/* -----------------------------------------------------------------------------
 * Pattern JSX
 * -----------------------------------------------------------------------------*/

const patternMap = {
  react: generateReactJsxPattern,
  solid: generateSolidJsxPattern,
  preact: generatePreactJsxPattern,
}

export function generateJsxPatterns(ctx: PandaContext) {
  if (!ctx.hasPatterns) return []
  return patternMap[ctx.jsxFramework!](ctx)
}

/* -----------------------------------------------------------------------------
 * Layout Grid
 * -----------------------------------------------------------------------------*/

const layoutGridMap = {
  react: generateReactLayoutGrid,
  preact: generatePreactLayoutGrid,
  solid: generateSolidLayoutGrid,
}

export function generateLayoutGrid(ctx: PandaContext) {
  return layoutGridMap[ctx.jsxFramework!]()
}
