import React from 'react'
import { assertType, describe, test } from 'vitest'
import { sva } from '../../styled-system-strict-tokens/css'
import { createSlotRecipeContext, styled } from '../../styled-system-strict-tokens/jsx'

type HandleProps = { position: 'n' | 'ne' | 'e' }
const HandlePart = (props: HandleProps) => <div data-position={props.position} />
const cropper = sva({
  slots: ['root', 'handle'],
  base: { handle: { display: 'block' } },
  variants: { size: { sm: {}, lg: {} } },
})
const { withContext, withProvider } = createSlotRecipeContext(cropper)

// Module scope: TS2590 only surfaces on the first instantiation of the type
const Swatch = styled('input', {}, { forwardProps: ['color'] })

describe('forwardProps with strictTokens', () => {
  test('types a forwarded prop from the component', () => {
    const Handle = withContext(HandlePart, 'handle', { forwardProps: ['position'] })
    assertType(<Handle position="ne" display="block" />)
    // @ts-expect-error `sticky` is a CSS position, not a handle position
    assertType(<Handle position="sticky" />)
  })

  test('keeps a forwarded variant typed as the variant', () => {
    const Root = withProvider('div', 'root', { forwardProps: ['size'] })
    assertType(<Root size="sm" />)
    // @ts-expect-error `xl` is not a size variant
    assertType(<Root size="xl" />)
  })

  test('keeps the style prop without forwardProps', () => {
    const Plain = withContext('div', 'handle')
    assertType(<Plain position="sticky" />)
  })

  test('applies to withProvider and styled()', () => {
    const Root = withProvider(HandlePart, 'root', { forwardProps: ['position'] })
    assertType(<Root position="e" />)
    const StyledHandle = styled(HandlePart, { base: {} }, { forwardProps: ['position'] })
    assertType(<StyledHandle position="n" />)
  })

  test('forwards a style prop on an element with many props', () => {
    assertType(<Swatch color="red" />)
    // @ts-expect-error `color` is typed from the input element
    assertType(<Swatch color={3} />)
  })
})
