import type { PandaContext } from '../context'
import { generateReactJsxFactory } from './react-jsx'
import { generateSolidJsxFactory } from './solid-jsx'

const frameworks = {
  react: generateReactJsxFactory,
  solid: generateSolidJsxFactory,
}

export function generateJsxFactory(ctx: PandaContext) {
  return frameworks[ctx.jsxFramework](ctx)
}
