import { describe, expect, test } from 'vitest'
import { inlineTransform, getTransformedCode } from './inline-helpers'

// Note: conditions must be unresolvable at parse time (the parser statically
// evaluates known values like `const x = true`). Using `declare const` or
// function params makes them unresolvable.

describe('conditional branch resolution', () => {
  describe('css() ternary', () => {
    test('simple ternary — resolves both branches', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ color: isDark ? "white" : "black" })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark ? 'c_white' : 'c_black'
        "
      `)
    })

    test('ternary with static props — static props in both branches', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ color: isDark ? "white" : "black", display: "flex" })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark ? 'c_white d_flex' : 'c_black d_flex'
        "
      `)
    })

    test('multiple conditional props with same condition', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ color: isDark ? "white" : "black", backgroundColor: isDark ? "gray.900" : "white" })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark ? 'c_white bg-c_gray.900' : 'c_black bg-c_white'
        "
      `)
    })

    test('complex condition expression', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const a: boolean
      declare const b: boolean
      const cls = css({ color: a && b ? "red" : "blue" })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = a && b ? 'c_red' : 'c_blue'
        "
      `)
    })
  })

  describe('css() && pattern', () => {
    test('&& with single prop — omits prop in false branch', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isActive: boolean
      const cls = css({ color: isActive && "red.500", display: "flex" })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isActive ? 'c_red.500 d_flex' : 'd_flex'
        "
      `)
    })

    test('multiple && props with same condition', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isActive: boolean
      const cls = css({ color: isActive && "red.500", backgroundColor: isActive && "blue.100" })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isActive ? 'c_red.500 bg-c_blue.100' : ''
        "
      `)
    })

    test('mixed ternary and && with same condition', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ color: isDark ? "white" : "black", backgroundColor: isDark && "gray.900" })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark ? 'c_white bg-c_gray.900' : 'c_black'
        "
      `)
    })
  })

  describe('css() nested conditions', () => {
    test('ternary inside _hover', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ _hover: { color: isDark ? "white" : "black" } })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark ? 'hover:c_white' : 'hover:c_black'
        "
      `)
    })

    test('ternary inside responsive value', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ color: { base: isDark ? "white" : "black", md: "gray" } })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark ? 'c_white md:c_gray' : 'c_black md:c_gray'
        "
      `)
    })
  })

  describe('css() deeply nested conditions', () => {
    test('double nested: _hover._focus with ternary', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ _hover: { _focus: { color: isDark ? "white" : "black" } } })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark ? 'hover:focus:c_white' : 'hover:focus:c_black'
        "
      `)
    })

    test('responsive array with ternary', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ color: [isDark ? "white" : "black", null, "gray"] })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark ? 'c_white md:c_gray' : 'c_black md:c_gray'
        "
      `)
    })

    test('responsive object with ternary at base and _hover', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ color: { base: isDark ? "white" : "black", md: "gray", _hover: isDark ? "red" : "blue" } })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark ? 'c_white md:c_gray hover:c_red' : 'c_black md:c_gray hover:c_blue'
        "
      `)
    })

    test('conditional whole value is an object', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ _hover: isDark ? { color: "white", bg: "gray.900" } : { color: "black", bg: "white" } })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark ? 'hover:c_white hover:bg_gray.900' : 'hover:c_black hover:bg_white'
        "
      `)
    })

    test('&& inside _hover', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isActive: boolean
      const cls = css({ _hover: { color: isActive && "red.500" }, display: "flex" })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isActive ? 'hover:c_red.500 d_flex' : 'd_flex'
        "
      `)
    })

    test('responsive array with && element', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ color: [isDark && "white", null, "gray"] })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark ? 'c_white md:c_gray' : 'md:c_gray'
        "
      `)
    })

    test('media query + selector with multiple conditionals across nesting depths', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({
        color: isDark ? "white" : "black",
        bg: isDark && "gray.900",
        _hover: {
          color: { base: isDark ? "red.300" : "blue.300", md: isDark ? "red.500" : "blue.500" },
          fontWeight: isDark && "bold",
        },
        md: {
          _focus: {
            borderColor: isDark ? "red" : "blue",
          },
        },
      })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark
          ? 'c_white bg_gray.900 hover:c_red.300 hover:md:c_red.500 hover:fw_bold md:focus:bd-c_red'
          : 'c_black hover:c_blue.300 hover:md:c_blue.500 md:focus:bd-c_blue'
        "
      `)
    })
  })

  describe('css() multiple different conditions', () => {
    test('two conditions — nested ternary', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      declare const isHovered: boolean
      const cls = css({ color: isDark ? "white" : "black", backgroundColor: isHovered ? "gray" : "white" })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark
          ? isHovered
            ? 'c_white bg-c_gray'
            : 'c_white bg-c_white'
          : isHovered
            ? 'c_black bg-c_gray'
            : 'c_black bg-c_white'
        "
      `)
    })

    test('two conditions with static props', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      declare const isMobile: boolean
      const cls = css({
        color: isDark ? "white" : "black",
        fontSize: isMobile ? "sm" : "lg",
        display: "flex",
      })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark
          ? isMobile
            ? 'c_white fs_sm d_flex'
            : 'c_white fs_lg d_flex'
          : isMobile
            ? 'c_black fs_sm d_flex'
            : 'c_black fs_lg d_flex'
        "
      `)
    })

    test('two conditions — ternary + && mixed', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      declare const isActive: boolean
      const cls = css({
        color: isDark ? "white" : "black",
        bg: isActive && "blue.500",
        display: "flex",
      })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark
          ? isActive
            ? 'c_white bg_blue.500 d_flex'
            : 'c_white d_flex'
          : isActive
            ? 'c_black bg_blue.500 d_flex'
            : 'c_black d_flex'
        "
      `)
    })

    test('two conditions nested in selectors', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      declare const isCompact: boolean
      const cls = css({
        color: isDark ? "white" : "black",
        _hover: { padding: isCompact ? "2" : "4" },
      })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark
          ? isCompact
            ? 'c_white hover:p_2'
            : 'c_white hover:p_4'
          : isCompact
            ? 'c_black hover:p_2'
            : 'c_black hover:p_4'
        "
      `)
    })

    test('three conditions', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      declare const isMobile: boolean
      declare const isActive: boolean
      const cls = css({
        color: isDark ? "white" : "black",
        fontSize: isMobile ? "sm" : "lg",
        bg: isActive && "blue.500",
      })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark
          ? isMobile
            ? isActive
              ? 'c_white fs_sm bg_blue.500'
              : 'c_white fs_sm'
            : isActive
              ? 'c_white fs_lg bg_blue.500'
              : 'c_white fs_lg'
          : isMobile
            ? isActive
              ? 'c_black fs_sm bg_blue.500'
              : 'c_black fs_sm'
            : isActive
              ? 'c_black fs_lg bg_blue.500'
              : 'c_black fs_lg'
        "
      `)
    })

    test('shared static props collapse in nested ternary', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      declare const isLarge: boolean
      const cls = css({
        color: isDark ? "white" : "black",
        fontSize: isLarge ? "2xl" : "md",
        display: "flex",
        alignItems: "center",
      })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isDark
          ? isLarge
            ? 'c_white fs_2xl d_flex ai_center'
            : 'c_white fs_md d_flex ai_center'
          : isLarge
            ? 'c_black fs_2xl d_flex ai_center'
            : 'c_black fs_md d_flex ai_center'
        "
      `)
    })
  })

  describe('css() bail cases', () => {
    test('multi-arg with conditional — bails', () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const cls = css({ display: "flex" }, { color: isDark ? "white" : "black" })
      `
      const result = inlineTransform(code)
      expect(result).toBeUndefined()
    })
  })

  describe('pattern() ternary', () => {
    test('hstack with conditional gap', async () => {
      const code = `
      import { hstack } from "styled-system/patterns"

      declare const isCompact: boolean
      const cls = hstack({ gap: isCompact ? "2" : "4" })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const cls = isCompact ? 'd_flex ai_center gap_2 flex-d_row' : 'd_flex ai_center gap_4 flex-d_row'
        "
      `)
    })
  })

  describe('mixed file', () => {
    test('conditional css() + static css() in same file', async () => {
      const code = `
      import { css } from "styled-system/css"

      declare const isDark: boolean
      const a = css({ display: "flex" })
      const b = css({ color: isDark ? "white" : "black" })
      `
      const result = inlineTransform(code)
      expect(result).toBeDefined()
      expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
        "const a = 'd_flex'
        const b = isDark ? 'c_white' : 'c_black'
        "
      `)
    })
  })
})
