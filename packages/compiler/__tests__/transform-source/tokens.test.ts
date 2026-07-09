import { describe, expect, test } from 'vitest'
import { createTransformProject, lines } from '../test-utils'

// A rich token dictionary that mirrors a small real theme: several color
// scales, a semantic color, spacing (numeric + named keys), fontSizes, radii
// and a named opacity token. Utilities are registered so `token()` used inside
// a `css()` value can resolve to an atomic class string.
const tokenCompiler = createTransformProject({
  conditions: { hover: '&:hover', dark: '.dark &' },
  theme: {
    breakpoints: { sm: '640px', md: '768px' },
    tokens: {
      colors: {
        red: { 500: { value: '#ef4444' }, 600: { value: '#dc2626' } },
        blue: { 500: { value: '#3b82f6' } },
        green: { 500: { value: '#22c55e' } },
        blank: { value: '' },
      },
      spacing: { 4: { value: '1rem' }, sm: { value: '8px' } },
      fontSizes: { md: { value: '1rem' }, lg: { value: '1.125rem' } },
      radii: { md: { value: '6px' } },
      opacity: { half: { value: '0.5' } },
    },
    semanticTokens: {
      colors: { primary: { value: { base: '{colors.red.500}', _dark: '{colors.blue.500}' } } },
    },
  },
  utilities: {
    color: {},
    backgroundColor: {},
    borderColor: {},
    margin: {},
    padding: {},
    fontSize: {},
    borderRadius: {},
  },
})

// Separate compilers to exercise css-var name generation config.
const prefixCompiler = createTransformProject({
  prefix: 'pd',
  theme: { tokens: { colors: { red: { 500: { value: '#ef4444' } } } } },
})
const hashCompiler = createTransformProject({
  hash: true,
  theme: { tokens: { colors: { red: { 500: { value: '#ef4444' } } } } },
})

describe('compiler.transformSource: tokens', () => {
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

  test('inlines a color token to its raw hex value', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token('colors.red.600')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "#dc2626""`)
  })

  test('inlines token.var() to a css variable reference', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token.var('colors.blue.500')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "var(--colors-blue-500)""`)
  })

  test('resolves tokens across multiple color scales', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      "export const g = token('colors.green.500')",
      "export const b = token('colors.blue.500')",
    )
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const g = "#22c55e"
      export const b = "#3b82f6""
    `)
  })

  test('inlines a spacing token with a numeric key', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const s = token('spacing.4')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const s = "1rem""`)
  })

  test('inlines a spacing token with a named key', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const s = token('spacing.sm')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const s = "8px""`)
  })

  test('inlines token.var() for a spacing token', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const s = token.var('spacing.4')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const s = "var(--spacing-4)""`)
  })

  test('inlines a fontSizes token', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const f = token('fontSizes.lg')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const f = "1.125rem""`)
  })

  test('inlines a radii token', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const r = token('radii.md')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const r = "6px""`)
  })

  test('ignores the fallback argument when the token path exists', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token('colors.red.500', 'hotpink')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "#ef4444""`)
  })

  test('ignores the fallback argument on token.var() when the path exists', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      "export const c = token.var('colors.red.500', 'var(--ignored)')",
    )
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "var(--colors-red-500)""`)
  })

  test('uses the fallback for an unknown token path', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      "export const c = token('colors.missing.999', 'navy')",
    )
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "navy""`)
  })

  test('uses the fallback for an unknown token.var() path', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      "export const c = token.var('colors.missing.999', 'var(--fallback)')",
    )
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "var(--fallback)""`)
  })

  test('leaves an unknown token path without a fallback unchanged', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token('colors.missing.999')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { token } from '@panda/tokens'
      export const c = token('colors.missing.999')",
      }
    `)
  })

  test('leaves an unknown token.var() path without a fallback unchanged', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token.var('colors.missing.999')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { token } from '@panda/tokens'
      export const c = token.var('colors.missing.999')",
      }
    `)
  })

  test('leaves a dynamic token path unchanged', () => {
    const source = lines("import { token } from '@panda/tokens'", 'export const c = token(dynamicPath)')
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { token } from '@panda/tokens'
      export const c = token(dynamicPath)",
      }
    `)
  })

  test('resolves a token path bound to a const string', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      "const path = 'colors.red.500'",
      'export const c = token(path)',
    )
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "const path = 'colors.red.500'
      export const c = "#ef4444""
    `)
  })

  test('resolves a color opacity modifier to a color-mix value (named opacity)', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token('colors.red.500/half')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const c = "color-mix(in oklab, var(--colors-red-500) 50%, transparent)""`,
    )
  })

  test('resolves a color opacity modifier to a color-mix value (numeric opacity)', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token('colors.red.500/40')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const c = "color-mix(in oklab, var(--colors-red-500) 40%, transparent)""`,
    )
  })

  test('uses the fallback when an opacity modifier targets a non-color token', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const m = token('spacing.4/40', 'auto')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const m = "auto""`)
  })

  test('leaves an opacity modifier on a non-color token without a fallback unchanged', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const m = token('spacing.4/40')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { token } from '@panda/tokens'
      export const m = token('spacing.4/40')",
      }
    `)
  })

  test('resolves a semantic token to its css variable', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token('colors.primary')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "var(--colors-red-500)""`)
  })

  test('resolves token.var() of a semantic token to its css variable', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token.var('colors.primary')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "var(--colors-primary)""`)
  })

  test('inlines a token used inside a css() value without double-rewriting', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "import { token } from '@panda/tokens'",
      "export const cls = css({ color: token('colors.red.500') })",
    )
    const result = tokenCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "color_#ef4444""`)
  })

  test('inlines a token.var() used inside a css() value', () => {
    const source = lines(
      "import { css } from '@panda/css'",
      "import { token } from '@panda/tokens'",
      "export const cls = css({ color: token.var('colors.red.500') })",
    )
    const result = tokenCompiler.transformSource({ path: 'src/button.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const cls = "color_var(--colors-red-500)""`)
  })

  test('inlines only the token in a plain object beside dynamic code', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      "export const theme = { brand: token('colors.red.500'), custom: props.w }",
    )
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const theme = { brand: "#ef4444", custom: props.w }"`)
  })

  test('inlines a token call inside a template literal', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      "export const border = `1px solid ${token('colors.red.500')}`",
    )
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const border = \`1px solid \${"#ef4444"}\`"`)
  })

  test('inlines a token call inside a calc template literal', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      "export const h = `calc(100dvh - ${token('spacing.4')})`",
    )
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const h = \`calc(100dvh - \${"1rem"})\`"`)
  })

  test('inlines multiple token calls across one file', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      "export const a = token('colors.red.500')",
      "export const b = token.var('spacing.4')",
      "export const c = token('fontSizes.md')",
    )
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const a = "#ef4444"
      export const b = "var(--spacing-4)"
      export const c = "1rem""
    `)
  })

  test('reflects the css-var prefix config in token.var() output', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token.var('colors.red.500')")
    const result = prefixCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "var(--pd-colors-red-500)""`)
  })

  test('reflects the hash config in token.var() output', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token.var('colors.red.500')")
    const result = hashCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "var(--iYfRb)""`)
  })

  test('resolves a token through an aliased import', () => {
    const source = lines("import { token as t } from '@panda/tokens'", "export const c = t('colors.red.500')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "#ef4444""`)
  })

  test('resolves token.var() through an aliased import', () => {
    const source = lines("import { token as t } from '@panda/tokens'", "export const c = t.var('colors.red.500')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect(result.code).toMatchInlineSnapshot(`"export const c = "var(--colors-red-500)""`)
  })

  test('inlines a token used in a JSX style value', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      "export const el = <div style={{ color: token('colors.red.500') }} />",
    )
    const result = tokenCompiler.transformSource({ path: 'src/comp.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div style={{ color: "#ef4444" }} />"`)
  })

  test('handles a token whose value is an empty string', () => {
    const source = lines("import { token } from '@panda/tokens'", "export const c = token('colors.blank')")
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { token } from '@panda/tokens'
      export const c = token('colors.blank')",
      }
    `)
  })

  test('does not resolve a token when the token() function is shadowed', () => {
    const source = lines(
      "import { token } from '@panda/tokens'",
      'function f() {',
      "  const token = (_) => 'override'",
      "  return token('colors.red.500')",
      '}',
    )
    const result = tokenCompiler.transformSource({ path: 'src/theme.ts', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { token } from '@panda/tokens'
      function f() {
        const token = (_) => 'override'
        return token('colors.red.500')
      }",
      }
    `)
  })
})
