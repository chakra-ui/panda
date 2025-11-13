/** @jsxImportSource preact */
import { describe, expect, test } from 'vitest'
// @ts-expect-error https://github.com/vitest-dev/vitest/issues/747#issuecomment-1140225294
import tlp = require('@testing-library/preact')
const render = tlp.render
import { createStyleContext } from '../../styled-system-preact/jsx/create-style-context'
import { slotButton } from '../../styled-system-preact/recipes'

const { withRootProvider, withProvider, withContext } = createStyleContext(slotButton)

const Root = withRootProvider('div')
const Icon = withProvider('span', 'icon')
const Label = withContext('span', 'root')

describe('style context - preact', () => {
  test('withProvider', () => {
    const { container } = render(
      <Root visual="outline">
        <Icon>Icon</Icon>
        <Label>Click me</Label>
      </Root>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<div><span class="slot-button__icon slot-button__icon--visual_unstyled">Icon</span><span class="slot-button__root slot-button__root--visual_outline">Click me</span></div>"`,
    )
  })

  test('withContext', () => {
    const { container } = render(
      <Root visual="solid">
        <Label>Click me</Label>
      </Root>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<div><span class="slot-button__root slot-button__root--visual_solid">Click me</span></div>"`,
    )
  })

  test('default props', () => {
    const RootWithDefaults = withRootProvider('div', { defaultProps: { 'data-testid': 'button-root' } })

    const { container } = render(
      <RootWithDefaults visual="solid">
        <Label>Click me</Label>
      </RootWithDefaults>,
    )

    expect(container.firstElementChild?.outerHTML).toMatchInlineSnapshot(
      `"<div data-testid="button-root"><span class="slot-button__root slot-button__root--visual_solid">Click me</span></div>"`,
    )
  })
})
