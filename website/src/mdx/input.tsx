import { css, cx } from '@/styled-system/css'
import { forwardRef } from 'react'

type Props = React.ComponentProps<'input'> & { suffix?: React.ReactNode }

const styles = {
  container: css({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    color: 'fg'
  }),

  input: css({
    display: 'block',
    w: 'full',
    appearance: 'none',
    rounded: 'lg',
    px: 3,
    py: 2,
    transition: 'shadow',
    textStyle: { base: 'md', md: 'sm' },
    lineHeight: 'tight',
    bg: 'bg.subtle',
    _focus: {
      bg: 'bg.surface'
    },
    _placeholder: {
      color: 'fg.muted'
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
