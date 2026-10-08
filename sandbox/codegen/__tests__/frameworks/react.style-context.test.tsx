import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { createRecipeContext, createSlotRecipeContext } from '../../styled-system/jsx'
import { buttonWithCompoundVariants, slotButton } from '../../styled-system/recipes'
import { sva } from '../../styled-system/css'

const { withProvider, withContext } = createSlotRecipeContext(slotButton)

const Root = withProvider('div', 'root')
const Icon = withProvider('span', 'icon')
const Label = withContext('span', 'root')

describe('style context - react', () => {
  test('context slots inherit the root variant, a nested provider slot does not', () => {
    const { container } = render(
      <Root visual="outline">
        <Icon>Icon</Icon>
        <Label>Click me</Label>
      </Root>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_outline"
        data-slot="root"
      >
        <span
          class="slot-button__icon slot-button__icon--visual_unstyled"
          data-slot="icon"
        >
          Icon
        </span>
        <span
          class="slot-button__root slot-button__root--visual_outline"
          data-slot="root"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('a context slot inherits the variant from its provider', () => {
    const { container } = render(
      <Root visual="solid">
        <Label>Click me</Label>
      </Root>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_solid"
        data-slot="root"
      >
        <span
          class="slot-button__root slot-button__root--visual_solid"
          data-slot="root"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('defaultProps land on the rendered element', () => {
    const RootWithDefaults = withProvider('div', 'root', { defaultProps: { 'data-testid': 'button-root' } })

    const { container } = render(
      <RootWithDefaults visual="solid">
        <Label>Click me</Label>
      </RootWithDefaults>,
    )

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_solid"
        data-slot="root"
        data-testid="button-root"
      >
        <span
          class="slot-button__root slot-button__root--visual_solid"
          data-slot="root"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('forwardProps exposes the variant to the component', () => {
    const RootWithForward = withProvider('div', 'root', { forwardProps: ['visual'] })

    const { container } = render(<RootWithForward visual="outline" />)

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_outline"
        data-slot="root"
        visual="outline"
      />
    `)
  })

  test('an sva recipe adds its slot class to each part', () => {
    const card = sva({ className: 'card', slots: ['root', 'title'], base: { title: { fontWeight: 'bold' } } })
    const { withProvider: withCardProvider, withContext: withCardContext } = createSlotRecipeContext(card)
    const CardRoot = withCardProvider('div', 'root')
    const CardTitle = withCardContext('h2', 'title')

    const { container } = render(
      <CardRoot>
        <CardTitle>Title</CardTitle>
      </CardRoot>,
    )

    expect(container.querySelector('[data-slot=root]')?.classList.contains('card__root')).toBe(true)
    expect(container.querySelector('[data-slot=title]')?.classList.contains('card__title')).toBe(true)
  })
})

describe('style context defaultProps', () => {
  test('an undefined prop keeps its default on withRootProvider', () => {
    const { withRootProvider } = createSlotRecipeContext(slotButton)
    const RootWithDefaults = withRootProvider('div', { defaultProps: { 'aria-label': 'Close' } })

    const { container } = render(<RootWithDefaults aria-label={undefined}>Close</RootWithDefaults>)

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        aria-label="Close"
      >
        Close
      </div>
    `)
  })

  test('an undefined prop keeps the value from PropsProvider', () => {
    const { withContext, PropsProvider } = createRecipeContext(buttonWithCompoundVariants)
    const Button = withContext('button')

    const { container } = render(
      <PropsProvider value={{ visual: 'solid', 'data-testid': 'close' }}>
        <Button visual={undefined} data-testid={undefined}>
          Close
        </Button>
      </PropsProvider>,
    )

    expect(container.querySelector('button')).toMatchInlineSnapshot(`
      <button
        class="button button--visual_solid button--compound__visual_solid"
        data-testid="close"
      >
        Close
      </button>
    `)
  })
})

describe('style context PropsProvider', () => {
  test('PropsProvider sets variants and props on withProvider', () => {
    const { withProvider, withContext, PropsProvider } = createSlotRecipeContext(slotButton)
    const ButtonRoot = withProvider('div', 'root')
    const ButtonLabel = withContext('span', 'root')

    const { container } = render(
      <PropsProvider value={{ visual: 'solid', 'data-testid': 'button' }}>
        <ButtonRoot>
          <ButtonLabel>Click me</ButtonLabel>
        </ButtonRoot>
      </PropsProvider>,
    )

    expect(container.querySelector('div')).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_solid"
        data-slot="root"
        data-testid="button"
      >
        <span
          class="slot-button__root slot-button__root--visual_solid"
          data-slot="root"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('passed props override PropsProvider', () => {
    const { withProvider, PropsProvider } = createSlotRecipeContext(slotButton)
    const ButtonRoot = withProvider('div', 'root')

    const { container } = render(
      <PropsProvider value={{ visual: 'solid' }}>
        <ButtonRoot visual="outline">Click me</ButtonRoot>
      </PropsProvider>,
    )

    expect(container.querySelector('div')).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_outline"
        data-slot="root"
      >
        Click me
      </div>
    `)
  })

  test('PropsProvider sets variants on withRootProvider', () => {
    const { withRootProvider, withContext, PropsProvider } = createSlotRecipeContext(slotButton)
    const ButtonRoot = withRootProvider('div')
    const ButtonLabel = withContext('span', 'root')

    const { container } = render(
      <PropsProvider value={{ visual: 'solid' }}>
        <ButtonRoot>
          <ButtonLabel>Click me</ButtonLabel>
        </ButtonRoot>
      </PropsProvider>,
    )

    expect(container.querySelector('div')).toMatchInlineSnapshot(`
      <div>
        <span
          class="slot-button__root slot-button__root--visual_solid"
          data-slot="root"
        >
          Click me
        </span>
      </div>
    `)
  })
})
