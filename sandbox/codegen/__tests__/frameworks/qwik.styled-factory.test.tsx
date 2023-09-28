import { createDOM } from '@builder.io/qwik/testing'
import { describe, expect, test } from 'vitest'
import { styled } from '../../styled-system-qwik/jsx'
import { buttonWithCompoundVariants } from '../../styled-system-qwik/recipes'
import React from 'react'

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
      '"<button class=\\"text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600\\">Click me</button>"',
    )
  })

  test('variant styles', async () => {
    const { render, screen } = await createDOM()
    await render(<Button size="sm">Click me</Button>)

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      '"<button class=\\"text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_sm px_sm py_xs\\">Click me</button>"',
    )
  })

  test('custom className', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button className="custom-btn" size="sm">
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      '"<button class=\\"text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_sm px_sm py_xs custom-btn\\">Click me</button>"',
    )
  })

  test('style prop', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button className="custom-btn" mx="2">
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      '"<button class=\\"text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 mx_2 custom-btn\\">Click me</button>"',
    )
  })

  test('style prop with variant', async () => {
    const { render, screen } = await createDOM()

    await render(
      <Button className="custom-btn" size="sm" mx="2">
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      '"<button class=\\"text_red.500 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_sm px_sm py_xs mx_2 custom-btn\\">Click me</button>"',
    )
  })

  test('css prop', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button className="custom-btn" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot(
      '"<button class=\\"text_red.100 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_md custom-btn\\">Click me</button>"',
    )
  })

  test('css prop with variant', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button className="custom-btn" size="sm" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )
    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot('"<button class=\\"text_red.100 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_md px_sm py_xs custom-btn\\">Click me</button>"')
  })

  test('all together', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button className="custom-btn" css={{ color: 'red.200', fontSize: 'xl' }} size="lg" mx="2">
        Click me
      </Button>,
    )
    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot('"<button class=\\"text_red.200 bg_blue.500 hover:text_red.600 hover:bg_blue.600 fs_xl px_123px py_md z_1 mx_2 custom-btn\\">Click me</button>"')
  })
})

describe('styled factory - button recipe', async () => {
  const Button = styled('button', buttonWithCompoundVariants)

  test('base styles', async () => {
    const { render, screen } = await createDOM()
    await render(<Button>Click me</Button>)

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot('"<button class=\\"button\\">Click me</button>"')
  })

  test('variant styles', async () => {
    const { render, screen } = await createDOM()
    await render(<Button size="sm">Click me</Button>)

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot('"<button class=\\"button button--size_sm\\">Click me</button>"')
  })

  test('custom className', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button className="custom-btn" size="sm">
        Click me
      </Button>,
    )
    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot('"<button class=\\"button button--size_sm custom-btn\\">Click me</button>"')
  })

  test('style prop', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button className="custom-btn" mx="2">
        Click me
      </Button>,
    )
    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot('"<button class=\\"button mx_2 custom-btn\\">Click me</button>"')
  })

  test('style prop with variant', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button className="custom-btn" size="sm" mx="2">
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot('"<button class=\\"button button--size_sm mx_2 custom-btn\\">Click me</button>"')
  })

  test('css prop', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button className="custom-btn" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )
    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot('"<button class=\\"button text_red.100 fs_md custom-btn\\">Click me</button>"')
  })

  test('css prop with variant', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button className="custom-btn" size="sm" css={{ color: 'red.100', fontSize: 'md' }}>
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot('"<button class=\\"button button--size_sm text_red.100 fs_md custom-btn\\">Click me</button>"')
  })

  test('all together', async () => {
    const { render, screen } = await createDOM()
    await render(
      <Button className="custom-btn" css={{ color: 'red.200', fontSize: 'xl' }} size="md" visual="outline" mx="2">
        Click me
      </Button>,
    )

    const container = screen.querySelector('button')!
    expect(container.outerHTML).toMatchInlineSnapshot('"<button class=\\"button button--visual_outline button--size_md text_red.200 mx_2 fs_xl custom-btn\\">Click me</button>"')
  })
})
