import { describe, expect, test } from 'vitest'
import { inlineTransform, getFullTransformedCode } from './inline-helpers'

describe('token() inlining', () => {
  test('inlines token() with resolved value', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const color = token("colors.red.500")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const color = '#ef4444'
      "
    `)
  })

  test('inlines token.var() with CSS variable', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const color = token("colors.red.500")
    const colorVar = token.var("colors.blue.500")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const color = '#ef4444'
      const colorVar = 'var(--colors-blue-500)'
      "
    `)
  })

  test('inlines token() for spacing token', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const space = token("spacing.4")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const space = '1rem'
      "
    `)
  })

  test('uses fallback when token path does not exist', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const color = token("colors.nonexistent", "#fallback")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const color = '#fallback'
      "
    `)
  })

  test('uses fallback for token.var() when path does not exist', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const value = token("colors.red.500")
    const color = token.var("colors.nonexistent", "var(--fallback)")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const value = '#ef4444'
      const color = 'var(--fallback)'
      "
    `)
  })

  test('ignores fallback when token exists', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const color = token("colors.red.500", "#ignored")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const color = '#ef4444'
      "
    `)
  })

  test('bails on dynamic token path', () => {
    const code = `
    import { token } from "styled-system/tokens"

    const color = token(dynamicPath)
    `
    const result = inlineTransform(code)
    expect(result).toBeUndefined()
  })

  test('bails when token not found and no fallback', () => {
    const code = `
    import { token } from "styled-system/tokens"

    const color = token("completely.nonexistent.path")
    `
    const result = inlineTransform(code)
    expect(result).toBeUndefined()
  })

  test('removes token import when fully inlined', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const color = token("colors.red.500")
    const space = token.var("spacing.4")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const color = '#ef4444'
      const space = 'var(--spacing-4)'
      "
    `)
  })

  test('works alongside css() inlining', async () => {
    const code = `
    import { css } from "styled-system/css"
    import { token } from "styled-system/tokens"

    const cls = css({ display: "flex" })
    const color = token("colors.red.500")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'd_flex'
      const color = '#ef4444'
      "
    `)
  })

  test('inlines multiple token() and token.var() calls', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const red = token("colors.red.500")
    const blue = token("colors.blue.500")
    const blueVar = token.var("colors.blue.500")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const red = '#ef4444'
      const blue = '#3b82f6'
      const blueVar = 'var(--colors-blue-500)'
      "
    `)
  })

  test('fallback is another token() call — inner inlined, outer bails', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const color = token("colors.nonexistent", token("colors.red.500"))
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "import { token } from 'styled-system/tokens'

      const color = token('colors.nonexistent', '#ef4444')
      "
    `)
  })

  test('token() used as value inside css()', async () => {
    const code = `
    import { css } from "styled-system/css"
    import { token } from "styled-system/tokens"

    const cls = css({ color: token("colors.red.500") })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'c_#ef4444'
      "
    `)
  })

  test('token() used as value inside cva()', async () => {
    const code = `
    import { cva } from "styled-system/css"
    import { token } from "styled-system/tokens"

    const btn = cva({
      base: { color: token("colors.red.500") },
      variants: { size: { sm: { padding: token("spacing.2") } } }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const btn = __cva('c_#ef4444', { size: { sm: 'p_0.5rem' } }, null, null)
      "
    `)
  })

  test('token.var() used as value inside css()', async () => {
    const code = `
    import { css } from "styled-system/css"
    import { token } from "styled-system/tokens"

    const cls = css({ color: token.var("colors.blue.500") })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'c_var(--colors-blue-500)'
      "
    `)
  })

  test('standalone token() in template literal', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const shadow = \`0 0 10px \${token("colors.red.500")}\`
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const shadow = \`0 0 10px \${'#ef4444'}\`
      "
    `)
  })

  test('token() in template literal inside css() boxShadow', async () => {
    const code = `
    import { css } from "styled-system/css"
    import { token } from "styled-system/tokens"

    const cls = css({ boxShadow: \`0 0 10px \${token("colors.red.200")}\` })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'bx-sh_0_0_10px_#fecaca'
      "
    `)
  })

  test('token.var() in template literal inside css() outline', async () => {
    const code = `
    import { css } from "styled-system/css"
    import { token } from "styled-system/tokens"

    const cls = css({ outline: \`2px solid \${token.var("colors.blue.500")}\` })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'ring_2px_solid_var(--colors-blue-500)'
      "
    `)
  })

  test('token.var() alongside css() triggers inlining', async () => {
    const code = `
    import { css } from "styled-system/css"
    import { token } from "styled-system/tokens"

    const cls = css({ display: "flex" })
    const colorVar = token.var("colors.red.500")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'd_flex'
      const colorVar = 'var(--colors-red-500)'
      "
    `)
  })

  test('aliased import: token as t with t() and t.var()', async () => {
    const code = `
    import { token as t } from "styled-system/tokens"

    const color = t("colors.red.500")
    const colorVar = t.var("colors.blue.500")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const color = '#ef4444'
      const colorVar = 'var(--colors-blue-500)'
      "
    `)
  })

  test('semantic token resolves to CSS variable', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const color = token("colors.primary")
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const color = 'var(--colors-primary)'
      "
    `)
  })

  test('multiple tokens in one template literal', async () => {
    const code = `
    import { token } from "styled-system/tokens"

    const shadow = \`\${token("spacing.2")} \${token("spacing.4")} \${token("spacing.8")} \${token("colors.red.200")}\`
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const shadow = \`\${'0.5rem'} \${'1rem'} \${'2rem'} \${'#fecaca'}\`
      "
    `)
  })
})
