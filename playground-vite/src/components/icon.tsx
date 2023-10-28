import { forwardRef } from 'react'
import { Button, ButtonProps } from './button'
import { styled } from '../../styled-system/jsx'
import { icon } from '../../styled-system/recipes'

export const Icon = styled('svg', icon, {
  defaultProps: {
    role: 'presentation',
    'aria-hidden': true,
    focusable: false,
  },
})

export const IconButton = forwardRef<typeof Button, ButtonProps>(
  (props, ref) => {
    return <Button padding='0' {...props} ref={ref as never} />
  }
)
