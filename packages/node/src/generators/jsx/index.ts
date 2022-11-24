import type { PandaContext } from '../../context'

import { generatePreactJsxFactory } from './preact-jsx'
import { generatePreactLayoutGrid } from './preact-layout-grid'
import { generatePreactJsxPattern } from './preact-pattern'

import { generateReactJsxFactory } from './react-jsx'
import { generateReactLayoutGrid } from './react-layout-grid'
import { generateReactJsxPattern } from './react-pattern'

import { generateSolidJsxFactory } from './solid-jsx'
import { generateSolidLayoutGrid } from './solid-layout-grid'
import { generateSolidJsxPattern } from './solid-pattern'

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
