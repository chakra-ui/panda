/** @jsxImportSource solid-js */
import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'
import { createStyleContext } from '../../styled-system-solid/jsx/create-style-context'
import { slotButton } from '../../styled-system-solid/recipes'

const { withProvider, withContext } = createStyleContext(slotButton)

const Root = withProvider('div', 'root')
const Icon = withProvider('span', 'icon')
const Label = withContext('span', 'root')

describe('style context - solid', () => {
  test('withProvider', () => {
    const { container } = render(() => (
      <Root visual="outline">
        <Icon>Icon</Icon>
        <Label>Click me</Label>
      </Root>
    ))

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_outline"
      >
        <span
          class="slot-button__icon slot-button__icon--visual_unstyled"
        >
          Icon
        </span>
        <span
          class="slot-button__root slot-button__root--visual_outline"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('withContext', () => {
    const { container } = render(() => (
      <Root visual="solid">
        <Label>Click me</Label>
      </Root>
    ))

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_solid"
      >
        <span
          class="slot-button__root slot-button__root--visual_solid"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('default props as object', () => {
    const RootWithDefaults = withProvider('div', 'root', { defaultProps: { 'data-testid': 'button-root' } })

    const { container } = render(() => (
      <RootWithDefaults visual="solid">
        <Label>Click me</Label>
      </RootWithDefaults>
    ))

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_solid"
        data-testid="button-root"
      >
        <span
          class="slot-button__root slot-button__root--visual_solid"
        >
          Click me
        </span>
      </div>
    `)
  })

  test('default props as function', () => {
    const RootWithFunctionDefaults = withProvider('div', 'root', {
      defaultProps: () => ({
        'data-testid': 'button-root-function',
        'data-framework': 'solid',
      }),
    })

    const { container } = render(() => (
      <RootWithFunctionDefaults visual="solid">
        <Label>Click me</Label>
      </RootWithFunctionDefaults>
    ))

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="slot-button__root slot-button__root--visual_solid"
        data-framework="solid"
        data-testid="button-root-function"
      >
        <span
          class="slot-button__root slot-button__root--visual_solid"
        >
          Click me
        </span>
      </div>
    `)
  })
})
