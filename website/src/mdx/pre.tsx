import { cva, cx } from '@/styled-system/css'

const preStyles = cva({
  base: {
    position: 'relative',
    mt: { base: '6', _first: '0' },
    bg: 'bg.muted!',
    overflowX: 'auto',
    rounded: 'xl',
    contain: 'paint',
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

export const Pre = (props: React.ComponentProps<'pre'>) => {
  const { className = '', ...rest } = props
  return (
    <pre
      className={cx(
        preStyles({ hasFilename: false }),
        'scroll-area',
        className
      )}
      {...rest}
    />
  )
}
