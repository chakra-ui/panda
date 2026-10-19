import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { createSlotRecipeContext, styled } from '../styled-system/jsx'
import { slotButton } from '../styled-system/recipes'

describe('data attributes on styled components', () => {
  test('data attributes are still accepted in JSX and defaultProps', () => {
    const Panel = styled('div', { base: { color: 'red.500' } }, { defaultProps: { 'data-part': 'panel' } })
    const { withProvider } = createSlotRecipeContext(slotButton)
    const Root = withProvider('div', 'root')

    const { container } = render(
      <Panel data-state="open">
        <Root data-testid="root" />
      </Panel>,
    )
    expect(container.firstElementChild?.getAttribute('data-state')).toBe('open')
    expect(container.querySelector('[data-testid=root]')).not.toBeNull()
  })
})
