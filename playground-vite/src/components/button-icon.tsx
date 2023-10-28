import type { ComponentPropsWithoutRef } from 'react'
import { styled } from '../../styled-system/jsx'

export interface ButtonIconProps
  extends ComponentPropsWithoutRef<typeof styled.span> {}
export const ButtonIcon = styled(styled.span, {
  base: {
    display: 'inline-flex',
    alignSelf: 'center',
    flexShrink: 0,
  },
})
