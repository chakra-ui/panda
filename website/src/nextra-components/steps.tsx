import type { ComponentProps, ReactElement } from 'react'
import { css, cx } from '../../styled-system/css'


export function Steps({
  children,
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cx(
        'nextra-steps',
        css({
          ml: 4,
          mb: 12,
          borderLeft: '1px solid token(colors.gray.200)',
          pl: 6,
          counterReset: 'step',
          '& > h3': {
            counterIncrement: 'step',
            _before: {
              h: '33px',
              w: '33px',
              borderWidth: '4px',
              borderColor: 'white',
              backgroundColor: 'yellow.300',
              position: 'absolute',
              textAlign: 'center',
              textIndent: '-1px',
              color: 'black',
              content: 'counter(step)',
              borderRadius: 'full',
              mt: '3px',
              ml: '-41px',
              fontSize: 'md',
              fontWeight: 'bold',
              lineHeight: 'relaxed',
            }
          },
          _dark: {
            borderColor: 'neutral.800',
            '& > h3': {
              _before: {
                borderColor: 'rgba(17,17,17,1)',
              }
            }
          }
        }),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
