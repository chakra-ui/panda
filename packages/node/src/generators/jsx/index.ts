import type { PandaContext } from '../../context'

import { generatePreactJsxFactory } from './preact-jsx'
import { generatePreactJsxPattern } from './preact-pattern'

import { generateReactJsxFactory } from './react-jsx'
import { generateReactJsxPattern } from './react-pattern'

import { generateSolidJsxFactory } from './solid-jsx'
import { generateSolidJsxPattern } from './solid-pattern'

const factoryMap = {
  react: generateReactJsxFactory,
  solid: generateSolidJsxFactory,
  preact: generatePreactJsxFactory,
}

export function generateJsxFactory(ctx: PandaContext) {
  return factoryMap[ctx.jsxFramework!](ctx)
}

const patternMap = {
  react: generateReactJsxPattern,
  solid: generateSolidJsxPattern,
  preact: generatePreactJsxPattern,
}

export function generateJsxPatterns(ctx: PandaContext) {
  return patternMap[ctx.jsxFramework!](ctx)
}
