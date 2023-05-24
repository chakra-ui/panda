import type { ComponentProps, ReactElement } from 'react'
import { cva, cx } from '../../styled-system/css'

const steps = cva({
  base: {
    ml: 4,
    mb: 12,
    borderLeft: '1px solid token(colors.gray.200)',
    pl: 6,
    counterReset: 'step',
    h3: {
      // @ts-ignore
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
        fontSize: '1rem',
        fontWeight: '400'
      }
    },
    _dark: {
      borderColor: 'neutral.800',
      h3: {
        _before: {
          // @ts-ignore
          borderColor: 'rgba(17,17,17,1)',
          backgroundColor: 'rgba(38,38,38,1)'
        }
      }
    }
  }
});

export function Steps({
  children,
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cx(
        'nextra-steps',
        steps({}),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
