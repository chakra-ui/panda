import type { Context } from '../create-context'
import { generateReactJsxFactory } from './react-jsx'
import { generateSolidJsxFactory } from './solid-jsx'

const frameworks = {
  react: generateReactJsxFactory,
  solid: generateSolidJsxFactory,
}

export function generateJsxFactory(ctx: Context) {
  return frameworks[ctx.jsx?.framework ?? 'react'](ctx)
}
