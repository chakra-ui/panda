import { describe, expect, test } from 'vitest'
import React from 'react'
import { Box, Stack, styled } from '../../styled-system-jsx-minimal/jsx'
import { render } from '@testing-library/react'
import { buttonWithCompoundVariants } from '../../styled-system-jsx-none/recipes'

describe('styled factory with an inline recipe', () => {
  const Button = styled('button', {
    base: {
      color: 'red.500',
      bg: 'blue.500',
      _hover: {
        color: 'red.600',
        bg: 'blue.600',
      },
    },
    variants: {
      size: {
        sm: {
          fontSize: 'sm',
          px: 'sm',
          py: 'xs',
        },
        md: {
          fontSize: 'md',
          px: 'md',
          py: 'sm',
        },
        lg: {
          fontSize: 'lg',
          px: 'lg',
          py: 'md',
        },
      },
    },
    compoundVariants: [
      {
        size: 'lg',
        css: { px: '123px', zIndex: 1 },
      },
    ],
  })

  test('base styles', () => {
    const { container } = render(<Button>Click me</Button>)

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="c_red.500 bg_blue.500 hover:c_red.600 hover:bg_blue.600"
      >
        Click me
      </button>
    `)
  })

  test('variant styles', () => {
    const { container } = render(<Button size="sm">Click me</Button>)

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="c_red.500 bg_blue.500 hover:c_red.600 hover:bg_blue.600 fs_sm px_sm py_xs"
      >
        Click me
      </button>
    `)
  })

  test('custom className', () => {
    const { container } = render(
      <Button className="custom-btn" size="sm">
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="c_red.500 bg_blue.500 hover:c_red.600 hover:bg_blue.600 fs_sm px_sm py_xs custom-btn"
      >
        Click me
      </button>
    `)
  })

  test('style prop stays an HTML attribute', () => {
    const { container } = render(
      // @ts-expect-error style props are not typed with jsxStyleProps: 'none'
      <Button className="custom-btn" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="c_red.500 bg_blue.500 hover:c_red.600 hover:bg_blue.600 custom-btn"
        mx="2"
      >
        Click me
      </button>
    `)
  })

  test('style prop stays an HTML attribute alongside a variant', () => {
    const { container } = render(
      // @ts-expect-error style props are not typed with jsxStyleProps: 'none'
      <Button className="custom-btn" size="sm" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="c_red.500 bg_blue.500 hover:c_red.600 hover:bg_blue.600 fs_sm px_sm py_xs custom-btn"
        mx="2"
      >
        Click me
      </button>
    `)
  })

  test('css prop', () => {
    const { container } = render(
      <Button className="custom-btn" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="c_red.100 bg_blue.500 hover:c_red.600 hover:bg_blue.600 fs_md custom-btn"
      >
        Click me
      </button>
    `)
  })

  test('css prop with variant', () => {
    const { container } = render(
      <Button className="custom-btn" size="sm" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="c_red.100 bg_blue.500 hover:c_red.600 hover:bg_blue.600 fs_md px_sm py_xs custom-btn"
      >
        Click me
      </button>
    `)
  })

  test('variant, style prop, css prop and className combined', () => {
    const { container } = render(
      // @ts-expect-error style props are not typed with jsxStyleProps: 'none'
      <Button className="custom-btn" css={{ color: 'red.200', fontSize: 'xl' }} size="lg" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="c_red.200 bg_blue.500 hover:c_red.600 hover:bg_blue.600 fs_xl px_123px py_md z_1 custom-btn"
        mx="2"
      >
        Click me
      </button>
    `)
  })
})

describe('styled factory with the buttonWithCompoundVariants config recipe', () => {
  const Button = styled('button', buttonWithCompoundVariants)

  test('base styles', () => {
    const { container } = render(<Button>Click me</Button>)

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="button button--visual_unstyled"
      >
        Click me
      </button>
    `)
  })

  test('variant styles', () => {
    const { container } = render(<Button size="sm">Click me</Button>)

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="button button--visual_unstyled button--size_sm"
      >
        Click me
      </button>
    `)
  })

  test('custom className', () => {
    const { container } = render(
      <Button className="custom-btn" size="sm">
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="button button--visual_unstyled button--size_sm custom-btn"
      >
        Click me
      </button>
    `)
  })

  test('style prop stays an HTML attribute', () => {
    const { container } = render(
      // @ts-expect-error style props are not typed with jsxStyleProps: 'none'
      <Button className="custom-btn" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="button button--visual_unstyled custom-btn"
        mx="2"
      >
        Click me
      </button>
    `)
  })

  test('style prop stays an HTML attribute alongside a variant', () => {
    const { container } = render(
      // @ts-expect-error style props are not typed with jsxStyleProps: 'none'
      <Button className="custom-btn" size="sm" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="button button--visual_unstyled button--size_sm custom-btn"
        mx="2"
      >
        Click me
      </button>
    `)
  })

  test('css prop', () => {
    const { container } = render(
      <Button className="custom-btn" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="button button--visual_unstyled c_red.100 fs_md custom-btn"
      >
        Click me
      </button>
    `)
  })

  test('css prop with variant', () => {
    const { container } = render(
      <Button className="custom-btn" size="sm" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="button button--visual_unstyled button--size_sm c_red.100 fs_md custom-btn"
      >
        Click me
      </button>
    `)
  })

  test('variant, style prop, css prop and className combined', () => {
    const { container } = render(
      // @ts-expect-error style props are not typed with jsxStyleProps: 'none'
      <Button className="custom-btn" css={{ color: 'red.200', fontSize: 'xl' }} size="md" visual="outline" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="button button--visual_outline button--size_md button--compound__size_md__visual_outline c_red.200 fs_xl custom-btn"
        mx="2"
      >
        Click me
      </button>
    `)
  })
})

describe('styled elements and patterns', () => {
  test('html props', () => {
    const { container } = render(
      // @ts-expect-error style props are not typed with jsxStyleProps: 'none'
      <styled.div htmlWidth={123} height="123">
        Click me
      </styled.div>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class=""
        height="123"
        width="123"
      >
        Click me
      </div>
    `)
  })

  test('Box leaves style props as HTML attributes', () => {
    const { container } = render(<Box color="red.300">Click me</Box>)

    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class=""
        color="red.300"
      >
        Click me
      </div>
    `,
    )
  })

  test('Stack applies its pattern props but not style props', () => {
    const { container } = render(
      <Stack direction="column" color="red.400">
        Click me
      </Stack>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="d_flex flex-d_column gap_8px"
        color="red.400"
      >
        Click me
      </div>
    `,
    )
  })
})
