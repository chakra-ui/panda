import { css, cx } from '@/styled-system/css'
import { forwardRef } from 'react'

type Props = React.ComponentProps<'input'> & { suffix?: React.ReactNode }

const styles = {
  container: css({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    color: 'gray.900',
    _dark: { color: 'gray.300' }
  }),

  input: css({
    display: 'block',
    w: 'full',
    appearance: 'none',
    rounded: 'lg',
    px: 3,
    py: 2,
    transition: 'colors',
    textStyle: 'md',
    lineHeight: 'tight',
    md: {
      textStyle: 'sm'
    },
    bgColor: 'rgb(0 0 0 / 0.05)',
    _dark: {
      color: 'gray.400',
      bgColor: 'rgb(249 250 251 / 0.1)',
      _focus: { bgColor: 'black' }
    },
    _focus: {
      bg: 'white'
    },
    _placeholder: {
      color: 'gray.500'
    }
  })
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, suffix, ...props }, forwardedRef) => (
    <div className={styles.container}>
      <input
        ref={forwardedRef}
        spellCheck={false}
        className={cx(className, styles.input)}
        {...props}
      />
      {suffix}
    </div>
  )
)

Input.displayName = 'Input'
