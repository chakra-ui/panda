import { describe, expect, test } from 'vitest'
import { createTransformProject, lines } from '../test-utils'

const compiler = createTransformProject({
  utilities: { color: {} },
})

const themedCompiler = createTransformProject({
  theme: {
    viewTransitions: {
      slide: {
        old: { opacity: 0 },
        new: { opacity: 1 },
      },
    },
  },
})

const prefixedCompiler = createTransformProject({
  prefix: 'p',
  theme: {
    viewTransitions: {
      slide: { old: { opacity: 0 } },
    },
  },
})

describe('compiler.transformSource: viewTransition', () => {
  test('inlines a static viewTransition() object to a class string and drops the dead import', () => {
    const source = lines(
      "import { viewTransition } from '@panda/css'",
      'export const slide = viewTransition({',
      "  group: { animationDuration: '0.4s' },",
      '  old: { opacity: 0 },',
      '  new: { opacity: 1 },',
      '})',
    )

    const result = compiler.transformSource({ path: 'src/vt.ts', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const slide = "vt_kXwuyX"",
      }
    `)
  })

  test('inlines viewTransition alongside css and drops the shared import', () => {
    const source = lines(
      "import { css, viewTransition } from '@panda/css'",
      "export const cls = css({ color: 'red' })",
      'export const slide = viewTransition({ old: { opacity: 0 }, new: { opacity: 1 } })',
    )

    const result = compiler.transformSource({ path: 'src/vt.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const cls = "color_red"
      export const slide = "vt_gnOaDr"",
      }
    `)
  })

  test('leaves a dynamic viewTransition(options) call unchanged', () => {
    const source = lines("import { viewTransition } from '@panda/css'", 'export const slide = viewTransition(options)')

    const result = compiler.transformSource({ path: 'src/vt.ts', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "bailed": false,
        "code": "import { viewTransition } from '@panda/css'
      export const slide = viewTransition(options)",
      }
    `)
  })

  test('keeps the runtime import when a dynamic sibling still needs it', () => {
    const source = lines(
      "import { viewTransition } from '@panda/css'",
      'export const slide = viewTransition({ old: { opacity: 0 }, new: { opacity: 1 } })',
      'export const dynamic = viewTransition(options)',
    )

    const result = compiler.transformSource({ path: 'src/vt.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { viewTransition } from '@panda/css'
      export const slide = "vt_gnOaDr"
      export const dynamic = viewTransition(options)"
    `)
  })

  test('skips the viewTransition.raw member call', () => {
    const source = lines(
      "import { viewTransition } from '@panda/css'",
      'export const slide = viewTransition.raw({ old: { opacity: 0 } })',
    )

    const result = compiler.transformSource({ path: 'src/vt.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { viewTransition } from '@panda/css'
      export const slide = viewTransition.raw({ old: { opacity: 0 } })",
      }
    `)
  })

  test('rewrites a named theme viewTransition to its stable class', () => {
    const source = lines("import { viewTransition } from '@panda/css'", "export const slide = viewTransition('slide')")

    const result = themedCompiler.transformSource({ path: 'src/vt.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "code": "export const slide = "vt_slide"",
      }
    `)
  })

  test('resolves a same-file const name to the theme class', () => {
    const source = lines(
      "import { viewTransition } from '@panda/css'",
      "const name = 'slide'",
      'export const slide = viewTransition(name)',
    )

    const result = themedCompiler.transformSource({ path: 'src/vt.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "code": "const name = 'slide'
      export const slide = "vt_slide"",
      }
    `)
  })

  test('leaves an unknown theme viewTransition name unchanged', () => {
    const source = lines("import { viewTransition } from '@panda/css'", "export const missing = viewTransition('fade')")

    const result = themedCompiler.transformSource({ path: 'src/vt.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { viewTransition } from '@panda/css'
      export const missing = viewTransition('fade')",
      }
    `)
  })

  test('applies the config prefix to a rewritten theme class', () => {
    const source = lines("import { viewTransition } from '@panda/css'", "export const slide = viewTransition('slide')")

    const result = prefixedCompiler.transformSource({ path: 'src/vt.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "code": "export const slide = "p-vt_slide"",
      }
    `)
  })
})
