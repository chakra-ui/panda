import { createContext } from '@pandacss/fixture'
import type { Config } from '@pandacss/types'
import { format } from 'prettier'
import { describe, expect, test } from 'vitest'
import { inlineFile } from '../src/inline'

const filePath = 'app/src/test.tsx'

function inlineTransform(code: string, userConfig?: Config) {
  const ctx = createContext(userConfig)
  ctx.project.addSourceFile(filePath, code)

  const encoder = ctx.encoder
  const result = ctx.project.parseSourceFile(filePath, encoder)
  if (!result || result.isEmpty()) return undefined

  return inlineFile(code, filePath, result, ctx)
}

/** Strip import statements so result can be evaluated with new Function() */
function stripImports(code: string): string {
  return code.replace(/^\s*import\s+.*$/gm, '')
}

/** Extract the transformed user code (strip helpers + imports), then format with prettier */
async function getTransformedCode(code: string): Promise<string> {
  const raw = code
    .replace(/^var __cva[\s\S]*?^};\n/m, '')
    .replace(/^var __sva[\s\S]*?^};\n/m, '')
    .replace(/^\s*import\s+.*$/gm, '')
    .trim()

  return format(raw, { parser: 'babel', printWidth: 100, semi: false, singleQuote: true })
}

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
