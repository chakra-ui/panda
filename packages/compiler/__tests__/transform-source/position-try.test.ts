import { describe, expect, test } from 'vitest'
import { createTransformProject, lines } from '../test-utils'

const compiler = createTransformProject({
  utilities: { color: {} },
})

const themedCompiler = createTransformProject({
  theme: {
    positionTry: {
      bottom: { top: 'anchor(bottom)', insetInlineStart: 'anchor(start)' },
    },
  },
})

const prefixedCompiler = createTransformProject({
  prefix: 'p',
  theme: {
    positionTry: { bottom: { top: 'anchor(bottom)' } },
  },
})

describe('compiler.transformSource: positionTry', () => {
  test('inlines a static positionTry() object to a dashed-ident and drops the dead import', () => {
    const source = lines(
      "import { positionTry } from '@panda/css'",
      "export const bottom = positionTry({ top: 'anchor(bottom)', insetInlineStart: 'anchor(start)' })",
    )

    const result = compiler.transformSource({ path: 'src/pt.ts', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const bottom = "--pt_dAuNmh"",
      }
    `)
  })

  test('inlines positionTry alongside css and drops the shared import', () => {
    const source = lines(
      "import { css, positionTry } from '@panda/css'",
      "export const cls = css({ color: 'red' })",
      "export const bottom = positionTry({ top: 'anchor(bottom)' })",
    )

    const result = compiler.transformSource({ path: 'src/pt.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const cls = "color_red"
      export const bottom = "--pt_glpgGL"",
      }
    `)
  })

  test('leaves a dynamic positionTry(options) call unchanged', () => {
    const source = lines("import { positionTry } from '@panda/css'", 'export const bottom = positionTry(options)')

    const result = compiler.transformSource({ path: 'src/pt.ts', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "bailed": false,
        "code": "import { positionTry } from '@panda/css'
      export const bottom = positionTry(options)",
      }
    `)
  })

  test('keeps the runtime import when a dynamic sibling still needs it', () => {
    const source = lines(
      "import { positionTry } from '@panda/css'",
      "export const bottom = positionTry({ top: 'anchor(bottom)' })",
      'export const dynamic = positionTry(options)',
    )

    const result = compiler.transformSource({ path: 'src/pt.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { positionTry } from '@panda/css'
      export const bottom = "--pt_glpgGL"
      export const dynamic = positionTry(options)"
    `)
  })

  test('skips the positionTry.raw member call', () => {
    const source = lines(
      "import { positionTry } from '@panda/css'",
      "export const bottom = positionTry.raw({ top: 'anchor(bottom)' })",
    )

    const result = compiler.transformSource({ path: 'src/pt.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { positionTry } from '@panda/css'
      export const bottom = positionTry.raw({ top: 'anchor(bottom)' })",
      }
    `)
  })

  test('rewrites a named theme positionTry to its stable ident', () => {
    const source = lines("import { positionTry } from '@panda/css'", "export const bottom = positionTry('bottom')")

    const result = themedCompiler.transformSource({ path: 'src/pt.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "code": "export const bottom = "--pt_bottom"",
      }
    `)
  })

  test('leaves an unknown theme positionTry name unchanged', () => {
    const source = lines("import { positionTry } from '@panda/css'", "export const missing = positionTry('top')")

    const result = themedCompiler.transformSource({ path: 'src/pt.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { positionTry } from '@panda/css'
      export const missing = positionTry('top')",
      }
    `)
  })

  test('applies the config prefix to a rewritten theme ident', () => {
    const source = lines("import { positionTry } from '@panda/css'", "export const bottom = positionTry('bottom')")

    const result = prefixedCompiler.transformSource({ path: 'src/pt.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "code": "export const bottom = "--p-pt_bottom"",
      }
    `)
  })
})
