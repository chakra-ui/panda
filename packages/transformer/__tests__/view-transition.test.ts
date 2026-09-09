import { createCompiler } from '@pandacss/compiler'
import { describe, expect, it } from 'vitest'
import { createSourceTransformer } from '../src'

function createTransformer(theme?: Record<string, unknown>) {
  const compiler = createCompiler({
    cwd: '/virtual',
    outdir: 'styled-system',
    jsxFramework: 'react',
    jsxFactory: 'styled',
    importMap: {
      css: ['@panda/css'],
      recipe: ['@panda/recipes'],
      pattern: ['@panda/patterns'],
      jsx: ['@panda/jsx'],
      tokens: ['@panda/tokens'],
    },
    ...(theme ? { theme } : {}),
  })
  return createSourceTransformer(compiler)
}

describe('transformer: viewTransition', () => {
  it('inlines a static viewTransition() to a class string and needs no internal runtime', () => {
    const transformer = createTransformer()
    const result = transformer.transformSource({
      path: 'src/app.tsx',
      source: [
        "import { viewTransition } from '@panda/css'",
        'export const slide = viewTransition({ old: { opacity: 0 }, new: { opacity: 1 } })',
      ].join('\n'),
    })

    // Inlined to a string: no `viewTransition(` call, no @pandacss-internal/css runtime, no helper demand.
    expect({ changed: result.changed, helper: result.helper, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "code": "export const slide = "vt_gnOaDr"",
        "helper": {
          "needsCva": false,
          "needsCx": false,
          "needsSva": false,
        },
      }
    `)
  })

  it('rewrites a named theme viewTransition through the transformer', () => {
    const transformer = createTransformer({
      viewTransitions: {
        slide: { old: { opacity: 0 }, new: { opacity: 1 } },
      },
    })
    const result = transformer.transformSource({
      path: 'src/app.tsx',
      source: ["import { viewTransition } from '@panda/css'", "export const slide = viewTransition('slide')"].join(
        '\n',
      ),
    })

    expect({ changed: result.changed, helper: result.helper, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "code": "export const slide = "vt_slide"",
        "helper": {
          "needsCva": false,
          "needsCx": false,
          "needsSva": false,
        },
      }
    `)
  })

  it('leaves a dynamic viewTransition(options) call untouched', () => {
    const transformer = createTransformer()
    const result = transformer.transformSource({
      path: 'src/app.tsx',
      source: ["import { viewTransition } from '@panda/css'", 'export const slide = viewTransition(options)'].join(
        '\n',
      ),
    })

    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { viewTransition } from '@panda/css'
      export const slide = viewTransition(options)",
      }
    `)
  })
})
