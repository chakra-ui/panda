import { describe, expect, test } from 'vitest'
import { inlineTransform, getTransformedCode, stripImports } from './inline-helpers'

describe('inline sva()', () => {
  test('replaces sva() call with __sva helper', async () => {
    const code = `
    import { sva } from "styled-system/css"

    const dialogStyles = sva({
      slots: ["root", "trigger"],
      base: {
        root: { display: "flex" },
        trigger: { cursor: "pointer" },
      },
      variants: {
        size: {
          sm: {
            root: { width: "200px" },
            trigger: { padding: "2" },
          },
          md: {
            root: { width: "400px" },
            trigger: { padding: "4" },
          }
        }
      }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const dialogStyles = __sva(
        {
          root: __cva('d_flex', { size: { sm: 'w_200px', md: 'w_400px' } }, null, null),
          trigger: __cva('cursor_pointer', { size: { sm: 'p_2', md: 'p_4' } }, null, null),
          sm: __cva('', { size: { sm: '', md: '' } }, null, null),
          md: __cva('', { size: { sm: '', md: '' } }, null, null),
        },
        { size: ['sm', 'md'] },
      )
      "
    `)
  })

  test('sva result returns object with slot keys', () => {
    const code = `
    import { sva } from "styled-system/css"

    const styles = sva({
      slots: ["root", "content"],
      base: {
        root: { display: "flex" },
        content: { padding: "4" },
      },
      variants: {
        size: {
          sm: {
            root: { width: "sm" },
            content: { fontSize: "sm" },
          },
        }
      },
      defaultVariants: { size: "sm" }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()

    const evalCode = stripImports(result!.code)
    const fn = new Function(evalCode + '\n return styles;')()
    expect(typeof fn).toBe('function')

    expect(fn()).toMatchInlineSnapshot(`
      {
        "content": "p_4 fs_sm",
        "root": "d_flex w_sm",
        "sm": "",
      }
    `)
  })

  test('sva variantMap', () => {
    const code = `
    import { sva } from "styled-system/css"

    const styles = sva({
      slots: ["root"],
      base: { root: { display: "flex" } },
      variants: {
        size: {
          sm: { root: { padding: "2" } },
          md: { root: { padding: "4" } },
        }
      }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()

    const evalCode = stripImports(result!.code)
    const fn = new Function(evalCode + '\n return styles;')()
    expect(fn.__cva__).toBe(false)
    expect(fn.variantKeys).toMatchInlineSnapshot(`
      [
        "size",
      ]
    `)
    expect(fn.variantMap).toMatchInlineSnapshot(`
      {
        "size": [
          "sm",
          "md",
        ],
      }
    `)
  })
})
