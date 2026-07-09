import { describe, expect, test } from 'vitest'
import { getBindingInfo } from '../src'
import { createTransformProject } from './test-utils'

const compiler = createTransformProject({
  utilities: {
    color: {},
    marginTop: {},
    padding: {},
    display: {},
  },
})

const pandaJsxCompiler = createTransformProject({
  jsxFactory: 'panda',
  jsxFramework: 'react',
  utilities: {
    color: {},
    fontWeight: {},
    gap: {},
    justifyContent: {},
  },
  patterns: {
    box: {
      jsxName: 'Box',
      properties: {},
    },
    hstack: {
      jsxName: 'HStack',
      properties: {
        gap: {
          type: 'property',
          value: 'gap',
        },
      },
    },
    wrap: {
      jsxName: 'Wrap',
      properties: {
        gap: {
          type: 'property',
          value: 'gap',
        },
        justifyContent: {
          type: 'property',
          value: 'justifyContent',
        },
      },
    },
  },
})

// Config recipe with a compound variant, default (eager) compound mode.
const recipeCompiler = createTransformProject({
  theme: {
    recipes: {
      button: {
        className: 'button',
        base: { display: 'inline-flex' },
        defaultVariants: { size: 'md', variant: 'solid' },
        variants: {
          size: { sm: { fontSize: '12px' }, md: { fontSize: '16px' }, lg: { fontSize: '18px' } },
          variant: { solid: { color: 'white' }, outline: { color: 'blue' } },
        },
        compoundVariants: [{ size: 'sm', variant: 'outline', css: { padding: '2px' } }],
      },
    },
  },
  utilities: {
    display: { className: 'd' },
    fontSize: { className: 'fs' },
    color: { className: 'c' },
    padding: {},
  },
})

// Token dictionary for token() / token.var() inlining.
const tokenCompiler = createTransformProject({
  theme: { tokens: { colors: { red: { 500: { value: '#ef4444' } } } } },
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

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
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

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const cls = "color_red""
    `)
  })

  test('rewrites duplicate object keys using last value', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const cls = css({ color: 'red', padding: '4px', color: 'blue' })",
    )

    const result = compiler.transformSource({ path: 'src/styles.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const cls = "color_blue padding_4px""
    `)
  })

  test('rewrites css.raw static objects', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "export const raw = css.raw({ color: 'red', padding: '4px' })",
    )

    const result = compiler.transformSource({ path: 'src/styles.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const raw = "color_red padding_4px""
    `)
  })

  test('rewrites multiple static css() calls in one file', () => {
    const source = lines("import { css } from '@panda/css'", "css({ color: 'red' })", "css({ marginTop: '4px' })")

    const result = compiler.transformSource({ path: 'src/styles.ts', source })
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

    const result = compiler.transformSource({ path: 'src/mixed.tsx', source })
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

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
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

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
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

    const result = compiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "const dark = true
      export const cls = "color_red""
    `)
  })

  test('forwards transform target options to the native layer', () => {
    const source = lines("import { css } from '@panda/css'", "export const cls = css({ color: 'red' })")

    const result = compiler.transformSource({
      path: 'src/button.tsx',
      source,
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

  test('rewrites pattern JSX css props with the panda factory config', () => {
    const source = lines(
      "import { HStack } from '@panda/jsx'",
      'export const el = <HStack gap="4" css={{ color: \'red\' }} />',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/patterns.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const el = <div className="color_red gap_4" />"
    `)
  })

  test('rewrites panda factory member tags to intrinsic elements', () => {
    const source = lines(
      "import { panda } from '@panda/jsx'",
      'export const el = <panda.footer color="red" fontWeight="bold">footer</panda.footer>',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/footer.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const el = <footer className="color_red font-weight_bold">footer</footer>"
    `)
  })

  test('rewrites Box as component identifiers without losing the target component', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      'export const el = <Box as={ChevronDownIcon} color="red" />',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/box.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const el = <ChevronDownIcon className="color_red" />"
    `)
  })

  test('inlines a config recipe compound class only when the combination matches', () => {
    const source = lines(
      "import { button } from '@panda/recipes'",
      "export const cls = button({ size: 'sm', variant: 'outline' })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { button } from '@panda/recipes'
      export const cls = "button button--size_sm button--variant_outline button--compound__size_sm__variant_outline""
    `)
  })

  test('omits a config recipe compound class when the combination does not match in eager mode', () => {
    const source = lines(
      "import { button } from '@panda/recipes'",
      "export const cls = button({ size: 'lg', variant: 'outline' })",
    )

    const result = recipeCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { button } from '@panda/recipes'
      export const cls = "button button--size_lg button--variant_outline""
    `)
  })

  test('inlines token() calls to their value and token.var() to a css var', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      "export const a = token('colors.red.500')",
      "export const b = token.var('colors.red.500')",
    )

    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const a = "#ef4444"
      export const b = "var(--colors-red-500)""
    `)
  })
})
