import { describe, expect, test } from 'vitest'
import { inlineTransform, getFullTransformedCode } from './inline-helpers'

describe('dead import removal', () => {
  test('removes css import when fully inlined', async () => {
    const code = `
    import { css } from "styled-system/css"

    const cls = css({ display: "flex" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'd_flex'
      "
    `)
  })

  test('removes pattern import when fully inlined', async () => {
    const code = `
    import { hstack } from "styled-system/patterns"

    const cls = hstack({ gap: "4" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'd_flex ai_center gap_4 flex-d_row'
      "
    `)
  })

  test('removes jsx import when fully inlined', async () => {
    const code = `
    import { Box } from "styled-system/jsx"

    const App = () => <Box mt="4" />
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <div className="mt_4" />
      "
    `)
  })

  test('removes styled import when fully inlined', async () => {
    const code = `
    import { styled } from "styled-system/jsx"

    const App = () => <styled.div display="flex" />
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <div className="d_flex" />
      "
    `)
  })

  test('removes recipe import when fully inlined', async () => {
    const code = `
    import { textStyle } from "styled-system/recipes"

    const cls = textStyle({ size: "h1" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const cls = 'textStyle textStyle--size_h1'
      "
    `)
  })

  test('removes cva import when fully inlined', async () => {
    const code = `
    import { cva } from "styled-system/css"

    const btn = cva({
      base: { display: "flex" },
      variants: { size: { sm: { padding: "2" } } }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const btn = __cva('d_flex', { size: { sm: 'p_2' } }, null, null)
      "
    `)
  })

  test('removes sva import when fully inlined', async () => {
    const code = `
    import { sva } from "styled-system/css"

    const styles = sva({
      slots: ["root"],
      base: { root: { display: "flex" } },
      variants: { size: { sm: { root: { padding: "2" } } } }
    })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const styles = __sva(
        {
          root: __cva('d_flex', { size: { sm: 'p_2' } }, null, null),
          sm: __cva('', { size: { sm: '' } }, null, null),
        },
        { size: ['sm'] },
      )
      "
    `)
  })

  test('keeps css import when css.raw() bails out', async () => {
    const code = `
    import { css } from "styled-system/css"

    const cls = css({ display: "flex" })
    const raw = css.raw({ color: "red" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "import { css } from 'styled-system/css'

      const cls = 'd_flex'
      const raw = css.raw({ color: 'red' })
      "
    `)
  })

  test('keeps pattern import when .raw() bails out', async () => {
    const code = `
    import { hstack } from "styled-system/patterns"

    const cls = hstack({ gap: "4" })
    const raw = hstack.raw({ gap: "2" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "import { hstack } from 'styled-system/patterns'

      const cls = 'd_flex ai_center gap_4 flex-d_row'
      const raw = hstack.raw({ gap: '2' })
      "
    `)
  })

  test('partial removal: keeps live specifiers, removes dead ones', async () => {
    const code = `
    import { css, cva } from "styled-system/css"

    const cls = css({ display: "flex" })
    const raw = cva.raw({ base: { color: "red" } })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "import { cva } from 'styled-system/css'

      const cls = 'd_flex'
      const raw = cva.raw({ base: { color: 'red' } })
      "
    `)
  })

  test('preserves non-panda imports', async () => {
    const code = `
    import React from "react"
    import { css } from "styled-system/css"

    const cls = css({ display: "flex" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "import React from 'react'

      const cls = 'd_flex'
      "
    `)
  })

  test('preserves import type declarations', async () => {
    const code = `
    import type { SystemStyleObject } from "styled-system/types"
    import { css } from "styled-system/css"

    const cls = css({ display: "flex" })
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "import type { SystemStyleObject } from 'styled-system/types'

      const cls = 'd_flex'
      "
    `)
  })

  test('removes all panda imports in mixed file', async () => {
    const code = `
    import { css } from "styled-system/css"
    import { hstack } from "styled-system/patterns"
    import { Box } from "styled-system/jsx"
    import React from "react"

    const cls = css({ display: "flex" })
    const stack = hstack({ gap: "4" })
    const App = () => <Box mt="4" />
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getFullTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "import React from 'react'

      const cls = 'd_flex'
      const stack = 'd_flex ai_center gap_4 flex-d_row'
      const App = () => <div className="mt_4" />
      "
    `)
  })

  test('keeps import when JSX element has spread (bail-out)', () => {
    const code = `
    import { Box } from "styled-system/jsx"

    const App = () => <Box {...props} color="red.300" />
    `
    const result = inlineTransform(code)
    expect(result).toBeUndefined()
  })

  test('keeps import when dynamic css arg bails out', () => {
    const code = `
    import { css } from "styled-system/css"

    const cls = css({ padding: "4" }, someVar)
    `
    const result = inlineTransform(code)
    expect(result).toBeUndefined()
  })
})
