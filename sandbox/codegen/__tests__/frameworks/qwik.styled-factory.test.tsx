/** @jsxImportSource @builder.io/qwik */
import { createDOM } from '@builder.io/qwik/testing'
import { describe, expect, test } from 'vitest'
import { Box, Stack, styled } from '../../styled-system-qwik/jsx'
import { buttonWithCompoundVariants } from '../../styled-system-qwik/recipes'

describe('styled factory - cva', async () => {
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

  test('base styles', async () => {
    const { render, screen } = await createDOM()
    await render(<Button>Click me</Button>)

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600">Click me</button>"`,
    )
  })

  test('variant styles', async () => {
    const { render, screen } = await createDOM()
    await render(<Button size="sm">Click me</Button>)

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_sm px_sm py_xs">Click me</button>"`,
    )
  })

  test('compound variants', async () => {
    const { render, screen } = await createDOM()
    await render(<Button size="lg">Click me</Button>)

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_lg px_123px py_md z_1">Click me</button>"`,
    )
  })

  test('custom className', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button class="custom-btn" size="sm">
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_sm px_sm py_xs custom-btn">Click me</button>"`,
    )
  })

  test('style prop', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button class="custom-btn" mx="2">
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 mx_2 custom-btn">Click me</button>"`,
    )
  })

  test('style prop with variant', async () => {
    const { render, screen } = await createDOM()

    await render(
      <Button class="custom-btn" size="sm" mx="2">
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_sm px_sm py_xs mx_2 custom-btn">Click me</button>"`,
    )
  })

  test('css prop', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button class="custom-btn" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.100 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_md custom-btn">Click me</button>"`,
    )
  })

  test('css prop with variant', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button class="custom-btn" size="sm" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )
    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.100 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_md px_sm py_xs custom-btn">Click me</button>"`,
    )
  })

  test('all together', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button class="custom-btn" css={{ color: 'red.200', fontSize: 'xl' }} size="lg" mx="2">
        Click me
      </Button>,
    )
    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="text_red.200 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_xl px_123px py_md z_1 mx_2 custom-btn">Click me</button>"`,
    )
  })

  test('nested composition', async () => {
    const StyledButton = styled('button', {
      base: {
        fontWeight: 'semibold',
        h: '10',
      },
      variants: {
        visual: {
          solid: {
            color: 'white',
          },
          outline: {
            borderColor: 'currentColor',
          },
        },
      },
    })
    const WithSize = styled(StyledButton, {
      base: {
        colorPalette: 'blue', // adding new key
      },
      variants: {
        size: {
          // new variant
          sm: { px: '2', fontSize: '12px' },
          lg: { px: '8', fontSize: '24px' },
        },
      },
    })
    const WithOverrides = styled(WithSize, {
      base: {
        borderWidth: '4px', // adding new key
        h: '20', // overriding 1st cva
      },
      variants: {
        visual: {
          outline: {
            // extend 1st cva
            colorPalette: 'red',
          },
        },
        size: {
          lg: { px: '12', fontSize: '32px' }, // override 2nd cva
          '2xl': { px: '20', fontSize: '40px' }, // add new one
        },
      },
    })

    const { render, screen } = await createDOM()
    await render(
      <WithOverrides visual="outline" size="lg">
        Click me
      </WithOverrides>,
    )
    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="fw_semibold h_20 color-palette_red border-w_4px border_currentColor px_12 fs_32px">Click me</button>"`,
    )

    const second = await createDOM()
    await second.render(
      <WithOverrides visual="solid" size="2xl">
        Click me
      </WithOverrides>,
    )
    const container2 = second.screen.querySelector('button')!
    expect(container2.outerHTML).toMatchInlineSnapshot(
      `"<button class="fw_semibold h_20 color-palette_blue border-w_4px text_white px_20 fs_40px">Click me</button>"`,
    )
  })

  test('html props', async () => {
    const { render, screen } = await createDOM()
    await render(
      <styled.div htmlWidth={123} height="123">
        Click me
      </styled.div>,
    )
    const container = screen.querySelector('div')!
    expect(container.outerHTML).toMatchInlineSnapshot(`"<div width="123" class="h_123">Click me</div>"`)
  })
})

describe('styled factory - button recipe', async () => {
  const Button = styled('button', buttonWithCompoundVariants)

  test('base styles', async () => {
    const { render, screen } = await createDOM()
    await render(<Button>Click me</Button>)

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(`"<button class="button button--visual_unstyled">Click me</button>"`)
  })

  test('variant styles', async () => {
    const { render, screen } = await createDOM()
    await render(<Button size="sm">Click me</Button>)

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(`"<button class="button button--visual_unstyled button--size_sm">Click me</button>"`)
  })

  test('compound variants', async () => {
    const { render, screen } = await createDOM()
    await render(<Button visual="solid">Click me</Button>)

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="button button--visual_solid text_blue">Click me</button>"`,
    )
  })

  test('custom className', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button class="custom-btn" size="sm">
        Click me
      </Button>,
    )
    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="button button--visual_unstyled button--size_sm custom-btn">Click me</button>"`,
    )
  })

  test('style prop', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button class="custom-btn" mx="2">
        Click me
      </Button>,
    )
    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(`"<button class="button button--visual_unstyled mx_2 custom-btn">Click me</button>"`)
  })

  test('style prop with variant', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button class="custom-btn" size="sm" mx="2">
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="button button--visual_unstyled button--size_sm mx_2 custom-btn">Click me</button>"`,
    )
  })

  test('css prop', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button class="custom-btn" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )
    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="button button--visual_unstyled text_red.100 fs_md custom-btn">Click me</button>"`,
    )
  })

  test('css prop with variant', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button class="custom-btn" size="sm" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="button button--visual_unstyled button--size_sm text_red.100 fs_md custom-btn">Click me</button>"`,
    )
  })

  test('all together', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button class="custom-btn" css={{ color: 'red.200', fontSize: 'xl' }} size="md" visual="outline" mx="2">
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<button class="button button--visual_outline button--size_md text_red.200 mx_2 fs_xl custom-btn">Click me</button>"`,
    )
  })

  test('box pattern', async () => {
    const { render, screen } = await createDOM()
    await render(<Box color="red.300">Click me</Box>)

    const container = screen.querySelector('div')!
    expect(container.outerHTML).toMatchInlineSnapshot(`"<div class="text_red.300">Click me</div>"`)
  })

  test('stack pattern', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Stack direction="column" color="red.400">
        Click me
      </Stack>,
    )

    const container = screen.querySelector('div')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      `"<div class="d_flex flex_column gap_10px text_red.400">Click me</div>"`,
    )
  })
})
