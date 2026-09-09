import { describe, expect, test } from 'vitest'
import { createTransformProject, lines } from '../test-utils'

const compiler = createTransformProject({
  utilities: { color: {} },
})

describe('compiler.transformSource: keyframes', () => {
  test('inlines a static keyframes() object to its animation name and drops the dead import', () => {
    const source = lines(
      "import { keyframes } from '@panda/css'",
      "export const spin = keyframes({ from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } })",
    )

    const result = compiler.transformSource({ path: 'src/kf.ts', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const spin = "kf_fhCilR"",
      }
    `)
  })

  test('inlines keyframes alongside css and drops the shared import', () => {
    const source = lines(
      "import { css, keyframes } from '@panda/css'",
      "export const cls = css({ color: 'red' })",
      'export const fade = keyframes({ from: { opacity: 0 } })',
    )

    const result = compiler.transformSource({ path: 'src/kf.tsx', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const cls = "color_red"
      export const fade = "kf_gdwKNo"",
      }
    `)
  })

  test('leaves a dynamic keyframes(stops) call unchanged', () => {
    const source = lines("import { keyframes } from '@panda/css'", 'export const fade = keyframes(stops)')

    const result = compiler.transformSource({ path: 'src/kf.ts', source })
    expect({ changed: result.changed, bailed: result.bailed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "bailed": false,
        "code": "import { keyframes } from '@panda/css'
      export const fade = keyframes(stops)",
      }
    `)
  })

  test('folds a keyframes value inside a css() call', () => {
    const source = lines(
      "import { css, keyframes } from '@panda/css'",
      'export const cls = css({ animationName: keyframes({ from: { opacity: 0 } }) })',
    )

    const result = compiler.transformSource({ path: 'src/kf.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "animation-name_kf_gdwKNo""`)
  })
})
