import type { PandaContext } from '../../context'
import { generatePreactJsxFactory } from './preact-jsx'
import { generateReactJsxFactory } from './react-jsx'
import { generateSolidJsxFactory } from './solid-jsx'

const frameworks = {
  react: generateReactJsxFactory,
  solid: generateSolidJsxFactory,
  preact: generatePreactJsxFactory,
}

export function generateJsxFactory(ctx: PandaContext) {
  return frameworks[ctx.jsxFramework!](ctx)
}
