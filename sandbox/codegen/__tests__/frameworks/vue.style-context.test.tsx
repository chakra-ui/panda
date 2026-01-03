/** @jsxImportSource vue */
import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/vue'
import { createStyleContext } from '../../styled-system-vue/jsx/create-style-context'
import { slotButton } from '../../styled-system-vue/recipes'

const { withProvider, withContext } = createStyleContext(slotButton)

const Root = withProvider('div', 'root')
const Icon = withProvider('span', 'icon')
const Label = withContext('span', 'root')

describe('style context - vue', () => {
  test('withProvider', () => {
    const { container } = render(
      <Root visual="outline">
        <Icon>Icon</Icon>
        <Label>Click me</Label>
      </Root>,
    )
    const { firstChild } = container as HTMLElement

    expect(firstChild).toMatchInlineSnapshot(`
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
    const { container } = render(
      <Root visual="solid">
        <Label>Click me</Label>
      </Root>,
    )
    const { firstChild } = container as HTMLElement

    expect(firstChild).toMatchInlineSnapshot(`
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

  test('default props', () => {
    const RootWithDefaults = withProvider('div', 'root', { defaultProps: { 'data-testid': 'button-root' } })

    const { container } = render(
      <RootWithDefaults visual="solid">
        <Label>Click me</Label>
      </RootWithDefaults>,
    )
    const { firstChild } = container as HTMLElement

    expect(firstChild).toMatchInlineSnapshot(`
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
})
