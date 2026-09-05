import { css, cva, cx } from '@/styled-system/css'
import { CopyButton } from './copy-button'

const preStyles = cva({
  base: {
    bg: 'bg.muted!',
    overflowX: 'auto',
    rounded: 'xl',
    contain: 'paint',
    maxH: '640px',
    '&:not(:has(.line))': {
      px: '4'
    },
    '& code[data-language] .line': {
      px: '4'
    }
  },
  variants: {
    hasFilename: {
      true: {
        pt: '12',
        pb: '4'
      },
      false: {
        py: '4'
      }
    }
  }
})

const wrapperStyles = css({
  position: 'relative',
  mt: { base: '6', _first: '0' }
})

export const Pre = (props: React.ComponentProps<'pre'>) => {
  const { className = '', ...rest } = props
  return (
    <div className={cx('not-prose', wrapperStyles)}>
      <pre
        className={cx(
          preStyles({ hasFilename: false }),
          'scroll-area',
          className
        )}
        {...rest}
      />
      <CopyButton />
    </div>
  )
}
