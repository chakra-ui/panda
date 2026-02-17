import { describe, expect, test } from 'vitest'
import { inlineTransform, getTransformedCode } from './inline-helpers'

describe('inline JSX style props', () => {
  test('replaces styled.div with div and className', async () => {
    const code = `
    import { styled } from "styled-system/jsx"

    const App = () => <styled.div display="flex" color="red.300" />
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <div className="d_flex c_red.300" />
      "
    `)
  })

  test('replaces styled.button preserving HTML tag', async () => {
    const code = `
    import { styled } from "styled-system/jsx"

    const App = () => <styled.button color="red.300" onClick={handler}>Click</styled.button>
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => (
        <button className="c_red.300" onClick={handler}>
          Click
        </button>
      )
      "
    `)
  })

  test('replaces Box with div', async () => {
    const code = `
    import { Box } from "styled-system/jsx"

    const App = () => <Box mt="4" px="2" />
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <div className="mt_4 px_2" />
      "
    `)
  })

  test('handles as prop to change HTML tag', async () => {
    const code = `
    import { Box } from "styled-system/jsx"

    const App = () => <Box as="section" display="flex" />
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <section className="d_flex" />
      "
    `)
  })

  test('handles as="span" with style props and children', async () => {
    const code = `
    import { Box } from "styled-system/jsx"

    const App = () => <Box as="span" color="red.300" fontWeight="bold">text</Box>
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <span className="c_red.300 fw_bold">text</span>
      "
    `)
  })

  test('handles as prop with component reference', async () => {
    const code = `
    import { Box } from "styled-system/jsx"

    const App = () => <Box as={Foo} color="red.300">text</Box>
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <Foo className="c_red.300">text</Foo>
      "
    `)
  })

  test('skips when as prop is a complex expression', () => {
    const code = `
    import { Box } from "styled-system/jsx"

    const App = () => <Box as={condition ? Foo : Bar} color="red.300" />
    `
    const result = inlineTransform(code)
    expect(result).toBeUndefined()
  })

  test('handles element with children (opening + closing tag)', async () => {
    const code = `
    import { Box } from "styled-system/jsx"

    const App = () => <Box color="blue.500">Hello</Box>
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <div className="c_blue.500">Hello</div>
      "
    `)
  })

  test('preserves non-style props', async () => {
    const code = `
    import { Box } from "styled-system/jsx"

    const App = () => <Box id="test" data-testid="box" mt="4" />
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <div className="mt_4" id="test" data-testid="box" />
      "
    `)
  })

  test('skips elements with spread props', () => {
    const code = `
    import { Box } from "styled-system/jsx"

    const App = () => <Box {...props} color="red.300" />
    `
    const result = inlineTransform(code)
    expect(result).toBeUndefined()
  })

  test('skips JSX elements with no style props (prevents replacing non-panda components)', async () => {
    const code = `
    import { css } from "styled-system/css"

    const App = () => (
      <Wrapper>
        <p className={css({ color: "red.300" })}>hello</p>
      </Wrapper>
    )
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    // css() should be inlined, but <Wrapper> must NOT be replaced with <div>
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => (
        <Wrapper>
          <p className={'c_red.300'}>hello</p>
        </Wrapper>
      )
      "
    `)
  })

  test('merges with existing className string', async () => {
    const code = `
    import { Box } from "styled-system/jsx"

    const App = () => <Box className="custom" mt="4" />
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <div className="custom mt_4" />
      "
    `)
  })
})

describe('inline JSX patterns', () => {
  test('replaces HStack JSX with div and pattern classNames', async () => {
    const code = `
    import { HStack } from "styled-system/jsx"

    const App = () => <HStack gap="4">children</HStack>
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <div className="d_flex ai_center gap_4 flex-d_row">children</div>
      "
    `)
  })

  test('replaces VStack JSX', async () => {
    const code = `
    import { VStack } from "styled-system/jsx"

    const App = () => <VStack gap="2" />
    `
    const result = inlineTransform(code)
    expect(result).toBeDefined()
    expect(await getTransformedCode(result!.code)).toMatchInlineSnapshot(`
      "const App = () => <div className="d_flex ai_center gap_2 flex-d_column" />
      "
    `)
  })
})
