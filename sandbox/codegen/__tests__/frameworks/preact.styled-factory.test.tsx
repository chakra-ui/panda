/** @jsxImportSource preact */
import { describe, expect, test } from 'vitest'
import { Box, Stack, styled } from '../../styled-system-preact/jsx'
// @ts-expect-error https://github.com/vitest-dev/vitest/issues/747#issuecomment-1140225294
import tlp = require('@testing-library/preact')
const render = tlp.render
import { buttonWithCompoundVariants } from '../../styled-system-preact/recipes'

describe('styled factory - cva', () => {
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

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600">Click me</button>"`,
    )
  })

  test('variant styles', () => {
    const { container } = render(<Button size="sm">Click me</Button>)

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_sm px_sm py_xs">Click me</button>"`,
    )
  })

  test('custom className', () => {
    const { container } = render(
      <Button className="custom-btn" size="sm">
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_sm px_sm py_xs custom-btn">Click me</button>"`,
    )
  })

  test('style prop', () => {
    const { container } = render(
      <Button className="custom-btn" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 mx_2 custom-btn">Click me</button>"`,
    )
  })

  test('style prop with variant', () => {
    const { container } = render(
      <Button className="custom-btn" size="sm" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_sm px_sm py_xs mx_2 custom-btn">Click me</button>"`,
    )
  })

  test('css prop', () => {
    const { container } = render(
      <Button className="custom-btn" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.100 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_md custom-btn">Click me</button>"`,
    )
  })

  test('css prop with variant', () => {
    const { container } = render(
      <Button className="custom-btn" size="sm" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.100 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_md px_sm py_xs custom-btn">Click me</button>"`,
    )
  })

  test('all together', () => {
    const { container } = render(
      <Button className="custom-btn" css={{ color: 'red.200', fontSize: 'xl' }} size="lg" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.200 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_xl px_123px py_md z_1 mx_2 custom-btn">Click me</button>"`,
    )
  })

  test('html props', () => {
    const { container } = render(
      <styled.div htmlWidth={123} height="123">
        Click me
      </styled.div>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<div width="123" class="h_123">Click me</div>"`,
    )
  })
})

describe('styled factory - button recipe', () => {
  const Button = styled('button', buttonWithCompoundVariants)

  test('base styles', () => {
    const { container } = render(<Button>Click me</Button>)

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="button">Click me</button>"`,
    )
  })

  test('variant styles', () => {
    const { container } = render(<Button size="sm">Click me</Button>)

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="button button--size_sm">Click me</button>"`,
    )
  })

  test('custom className', () => {
    const { container } = render(
      <Button className="custom-btn" size="sm">
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="button button--size_sm custom-btn">Click me</button>"`,
    )
  })

  test('style prop', () => {
    const { container } = render(
      <Button className="custom-btn" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="button mx_2 custom-btn">Click me</button>"`,
    )
  })

  test('style prop with variant', () => {
    const { container } = render(
      <Button className="custom-btn" size="sm" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="button button--size_sm mx_2 custom-btn">Click me</button>"`,
    )
  })

  test('css prop', () => {
    const { container } = render(
      <Button className="custom-btn" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="button text_red.100 fs_md custom-btn">Click me</button>"`,
    )
  })

  test('css prop with variant', () => {
    const { container } = render(
      <Button className="custom-btn" size="sm" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="button button--size_sm text_red.100 fs_md custom-btn">Click me</button>"`,
    )
  })

  test('all together', () => {
    const { container } = render(
      <Button className="custom-btn" css={{ color: 'red.200', fontSize: 'xl' }} size="md" visual="outline" mx="2">
        Click me
      </Button>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<button class="button button--visual_outline button--size_md mx_2 text_red.200 fs_xl custom-btn">Click me</button>"`,
    )
  })

  test('box pattern', () => {
    const { container } = render(<Box color="red.300">Click me</Box>)

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<div class="text_red.300">Click me</div>"`,
    )
  })

  test('stack pattern', () => {
    const { container } = render(
      <Stack direction="column" color="red.400">
        Click me
      </Stack>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<div class="d_flex flex_column gap_10px text_red.400">Click me</div>"`,
    )
  })
})
