import type { ComponentProps, ReactElement } from 'react'
import { css } from '../../styled-system/css'

export const Button = ({
  children,
  className = '',
  ...props
}: ComponentProps<'button'>): ReactElement => {
  return (
    <button
      className={[
        'nextra-button',
        css({
          transitionProperty: 'all',
          opacity: '0.5',
          bg: 'hsl(var(--nextra-primary-hue) 100% var(--color-primary-700-hue) / 0.05)', // primary-700/5
          border: '1px solid',
          borderColor: 'black',
          color: 'gray.600',
          _hover: {
            color: 'gray.900'
          },
          rounded: 'md',
          p: '1.5',
          _dark: {
            bg: 'hsl(var(--nextra-primary-hue) 100% var(--color-primary-300-hue) / 0.1)', // primary.300/10
            borderColor: 'rgba(255, 255, 255, 0.1)',
            color: 'gray.400',
            _hover: {
              color: 'gray.50'
            }
          }
        }),
        className
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
