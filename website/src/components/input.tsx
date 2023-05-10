import type { ComponentProps, ReactNode } from 'react'
import { forwardRef } from 'react'
import { css, cx } from '../../styled-system/css'

type InputProps = ComponentProps<'input'> & { suffix?: ReactNode }

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, suffix, ...props }, forwardedRef) => (
    <div
      className={css({
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        color: 'gray.900',
        _moreContrast: { color: 'gray.800', _dark: { color: 'gray.300' } },
        _dark: { color: 'gray.300' }
      })}
    >
      <input
        ref={forwardedRef}
        spellCheck={false}
        className={cx(
          className,
          css({
            display: 'block',
            w: 'full',
            appearance: 'none',
            rounded: 'lg',
            px: 3,
            py: 2,
            transitionProperty: 'colors',
            textStyle: 'md',
            lineHeight: 'tight',
            md: {
              textStyle: 'sm'
            },
            bgColor: 'rgb(0 0 0 / 0.05)', // opacity modifier
            _dark: {
              color: 'gray.400',
              // bgColor: 'gray.50/0.1',
              bgColor: 'rgb(249 250 251 / 0.1)',
              _focus: { bgColor: 'black' }
            },
            _focus: {
              bg: 'white'
            },
            _placeholder: {
              color: 'gray.500'
            },
            _moreContrast: {
              border: '1px solid',
              borderColor: 'currentColor'
            }
          })
        )}
        {...props}
      />
      {suffix}
    </div>
  )
)

Input.displayName = 'Input'
