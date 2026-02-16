import { describe, expect, test } from 'vitest'
import { inlineTransform, getTransformedCode } from './inline-helpers'

describe('inline css()', () => {
  test('replaces simple css() call with className string', async () => {
    const code = `
    import { css } from "styled-system/css"

    const cls = css({ display: "flex", color: "red.300" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'd_flex c_red.300'
      "
    `)
  })

  test('replaces multiple css() calls', async () => {
    const code = `
    import { css } from "styled-system/css"

    const a = css({ display: "flex" })
    const b = css({ color: "blue.500" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const a = 'd_flex'
      const b = 'c_blue.500'
      "
    `)
  })

  test('handles responsive values', async () => {
    const code = `
    import { css } from "styled-system/css"

    const cls = css({ color: { base: "blue", md: "red" } })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'c_blue md:c_red'
      "
    `)
  })

  test('handles shorthand properties', async () => {
    const code = `
    import { css } from "styled-system/css"

    const cls = css({ mt: "4", px: "2" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'mt_4 px_2'
      "
    `)
  })

  test('returns undefined for file without panda imports', () => {
    const code = `
    const x = 1 + 2
    `
    const result = inlineTransform(code)
    expect(result).toBeUndefined()
  })

  test('generates source map', () => {
    const code = `
    import { css } from "styled-system/css"

    const cls = css({ display: "flex" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(result!.map).toBeDefined()
  })
})

describe('inline patterns', () => {
  test('replaces hstack() call', async () => {
    const code = `
    import { hstack } from "styled-system/patterns"

    const cls = hstack({ gap: "4" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'd_flex ai_center gap_4 flex-d_row'
      "
    `)
  })

  test('replaces vstack() call', async () => {
    const code = `
    import { vstack } from "styled-system/patterns"

    const cls = vstack({ gap: "2" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'd_flex ai_center gap_2 flex-d_column'
      "
    `)
  })

  test('replaces pattern with extra style props', async () => {
    const code = `
    import { hstack } from "styled-system/patterns"

    const cls = hstack({ gap: "4", bg: "green.100", padding: "4" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'd_flex ai_center gap_4 flex-d_row bg_green.100 p_4'
      "
    `)
  })
})

describe('inline config recipes', () => {
  test('replaces recipe call with variant classNames', async () => {
    const code = `
    import { textStyle } from "styled-system/recipes"

    const cls = textStyle({ size: "h1" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'textStyle textStyle--size_h1'
      "
    `)
  })

  test('recipe with defaultVariants fills in missing variants', async () => {
    const code = `
    import { buttonStyle } from "styled-system/recipes"

    const cls = buttonStyle({})
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'buttonStyle buttonStyle--size_md buttonStyle--variant_solid'
      "
    `)
  })

  test('recipe user variants override defaultVariants', async () => {
    const code = `
    import { buttonStyle } from "styled-system/recipes"

    const cls = buttonStyle({ size: "sm" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'buttonStyle buttonStyle--size_sm buttonStyle--variant_solid'
      "
    `)
  })

  test('recipe with no variants produces base className only', async () => {
    const code = `
    import { tooltipStyle } from "styled-system/recipes"

    const cls = tooltipStyle({})
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'tooltipStyle'
      "
    `)
  })

  test('recipe with boolean variant', async () => {
    const code = `
    import { cardStyle } from "styled-system/recipes"

    const cls = cardStyle({ rounded: true })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'card card--rounded_true'
      "
    `)
  })
})

describe('mixed calls in one file', () => {
  test('handles css + pattern + cva in same file', async () => {
    const code = `
    import { css, cva } from "styled-system/css"
    import { hstack } from "styled-system/patterns"

    const cls = css({ display: "flex" })
    const stack = hstack({ gap: "4" })
    const btn = cva({
      base: { color: "red" },
      variants: {
        size: { sm: { padding: "2" } }
      }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'd_flex'
      const stack = 'd_flex ai_center gap_4 flex-d_row'
      const btn = __cva('c_red', { size: { sm: 'p_2' } }, null, null)
      "
    `)
  })
})
