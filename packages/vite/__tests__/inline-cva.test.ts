import { describe, expect, test } from 'vitest'
import { inlineTransform, getTransformedCode, stripImports } from './inline-helpers'

describe('inline cva()', () => {
  test('replaces cva() call with __cva helper', async () => {
    const code = `
    import { cva } from "styled-system/css"

    const buttonStyles = cva({
      base: { display: "inline-flex", alignItems: "center" },
      variants: {
        size: {
          sm: { fontSize: "sm", padding: "2" },
          md: { fontSize: "md", padding: "4" },
        }
      }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const buttonStyles = __cva(
        'd_inline-flex ai_center',
        { size: { sm: 'fs_sm p_2', md: 'fs_md p_4' } },
        null,
        null,
      )
      "
    `)
  })

  test('cva with defaultVariants', async () => {
    const code = `
    import { cva } from "styled-system/css"

    const styles = cva({
      base: { color: "red" },
      variants: {
        size: {
          sm: { padding: "2" },
          md: { padding: "4" },
        }
      },
      defaultVariants: {
        size: "md"
      }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const styles = __cva('c_red', { size: { sm: 'p_2', md: 'p_4' } }, { size: 'md' }, null)
      "
    `)
  })

  test('cva with compoundVariants', async () => {
    const code = `
    import { cva } from "styled-system/css"

    const styles = cva({
      base: { display: "flex" },
      variants: {
        color: {
          red: { background: "red" },
          blue: { background: "blue" },
        },
        size: {
          sm: { fontSize: "sm" },
          md: { fontSize: "md" },
        }
      },
      compoundVariants: [
        {
          color: "red",
          size: "sm",
          css: { fontWeight: "bold" }
        }
      ]
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const styles = __cva(
        'd_flex',
        { color: { red: 'bg_red', blue: 'bg_blue' }, size: { sm: 'fs_sm', md: 'fs_md' } },
        null,
        [[{ color: 'red', size: 'sm' }, 'fw_bold']],
      )
      "
    `)
  })

  test('cva result is callable function', () => {
    const code = `
    import { cva } from "styled-system/css"

    const styles = cva({
      base: { display: "flex" },
      variants: {
        size: {
          sm: { padding: "2" },
          md: { padding: "4" },
        }
      },
      defaultVariants: { size: "md" }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()

    const evalCode = stripImports(result!.code)
    const fn = new Function(evalCode + '\n return styles;')()
    expect(typeof fn).toBe('function')

    expect(fn()).toMatchInlineSnapshot(`"d_flex p_4"`)
    expect(fn({ size: 'sm' })).toMatchInlineSnapshot(`"d_flex p_2"`)
  })

  test('cva variantMap and variantKeys', () => {
    const code = `
    import { cva } from "styled-system/css"

    const styles = cva({
      base: { display: "flex" },
      variants: {
        size: {
          sm: { padding: "2" },
          md: { padding: "4" },
        },
        visual: {
          solid: { bg: "blue.500" },
          outline: { borderWidth: "1px" },
        }
      }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()

    const evalCode = stripImports(result!.code)
    const fn = new Function(evalCode + '\n return styles;')()
    expect(fn.__cva__).toBe(true)
    expect(fn.variantKeys).toMatchInlineSnapshot(`
      [
        "size",
        "visual",
      ]
    `)
    expect(fn.variantMap).toMatchInlineSnapshot(`
      {
        "size": [
          "sm",
          "md",
        ],
        "visual": [
          "solid",
          "outline",
        ],
      }
    `)
  })

  test('cva splitVariantProps', () => {
    const code = `
    import { cva } from "styled-system/css"

    const styles = cva({
      base: { display: "flex" },
      variants: {
        size: {
          sm: { padding: "2" },
        }
      }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()

    const evalCode = stripImports(result!.code)
    const fn = new Function(evalCode + '\n return styles;')()
    const [variantProps, restProps] = fn.splitVariantProps({
      size: 'sm',
      className: 'extra',
    })
    expect(variantProps).toMatchInlineSnapshot(`
      {
        "size": "sm",
      }
    `)
    expect(restProps).toMatchInlineSnapshot(`
      {
        "className": "extra",
      }
    `)
  })
})
