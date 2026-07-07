import { describe, expect, test } from 'vitest'
import { getBindingInfo } from '../src'
import { createProject } from './test-utils'

const compiler = createProject({
  utilities: {
    color: {},
    marginTop: {},
    padding: {},
    display: {},
  },
})

function lines(...parts: string[]) {
  return parts.join('\n')
}

describe('compiler.transformSource', () => {
  test('native binding is loaded', () => {
    expect(getBindingInfo()).toMatchInlineSnapshot(`
      {
        "native": true,
      }
    `)
  })

  test('rewrites static css() calls to class strings', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', marginTop: '4px' })",
    )

    const result = compiler.transformSource('src/button.tsx', source)
    expect({
      changed: result.changed,
      bailed: result.bailed,
      code: result.code,
    }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const cls = "color_red margin-top_4px"",
      }
    `)
  })

  test('rewrites namespace css member calls', () => {
    const source = lines("import * as panda from '@panda/css'", "export const cls = panda.css({ color: 'red' })")

    const result = compiler.transformSource('src/button.tsx', source)
    expect(result.code).toMatchInlineSnapshot(`
      "export const cls = "color_red""
    `)
  })

  test('rewrites duplicate object keys using last value', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', padding: '4px', color: 'blue' })",
    )

    const result = compiler.transformSource('src/styles.ts', source)
    expect(result.code).toMatchInlineSnapshot(`
      "export const cls = "color_blue padding_4px""
    `)
  })

  test('rewrites css.raw static objects', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const raw = css.raw({ color: 'red', padding: '4px' })",
    )

    const result = compiler.transformSource('src/styles.ts', source)
    expect(result.code).toMatchInlineSnapshot(`
      "export const raw = "color_red padding_4px""
    `)
  })

  test('rewrites multiple static css() calls in one file', () => {
    const source = lines("import { css } from '@panda/css'", "css({ color: 'red' })", "css({ marginTop: '4px' })")

    const result = compiler.transformSource('src/styles.ts', source)
    expect(result.code).toMatchInlineSnapshot(`
      ""color_red"
      "margin-top_4px""
    `)
  })

  test('rewrites mixed static and unextractable dynamic calls', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const staticCls = css({ color: 'red' })",
      'export const dynamicCls = css({ color: props.color })',
    )

    const result = compiler.transformSource('src/mixed.tsx', source)
    expect({
      changed: result.changed,
      bailed: result.bailed,
      code: result.code,
    }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "import { css } from '@panda/css'
      export const staticCls = "color_red"
      export const dynamicCls = css({ color: props.color })",
      }
    `)
  })

  test('leaves unextractable dynamic css() calls untouched', () => {
    const source = lines("import { css } from '@panda/css'", 'export const cls = css({ color: props.color })')

    const result = compiler.transformSource('src/button.tsx', source)
    expect({
      changed: result.changed,
      bailed: result.bailed,
      code: result.code,
    }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "bailed": false,
        "code": "import { css } from '@panda/css'
      export const cls = css({ color: props.color })",
      }
    `)
  })

  test('rewrites finite conditional css values to a runtime ternary', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: isError ? 'red' : 'blue' })",
    )

    const result = compiler.transformSource('src/button.tsx', source)
    expect({
      changed: result.changed,
      bailed: result.bailed,
      code: result.code,
    }).toMatchInlineSnapshot(`
      {
        "changed": true,
        "bailed": false,
        "code": "export const cls = isError ? "color_red" : "color_blue"",
      }
    `)
  })

  test('folds const-bound ternaries when the branch is static', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      'const dark = true',
      "export const cls = css({ color: dark ? 'red' : 'blue' })",
    )

    const result = compiler.transformSource('src/button.tsx', source)
    expect(result.code).toMatchInlineSnapshot(`
      "const dark = true
      export const cls = "color_red""
    `)
  })

  test('forwards transform target options to the native layer', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ color: 'red' })")

    const result = compiler.transformSource('src/button.tsx', source, {
      targetsCss: false,
      targetsPatterns: true,
    })

    expect({
      changed: result.changed,
      bailed: result.bailed,
      code: result.code,
    }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "bailed": false,
        "code": "import { css } from '@panda/css'
      export const cls = css({ color: 'red' })",
      }
    `)
  })
})
