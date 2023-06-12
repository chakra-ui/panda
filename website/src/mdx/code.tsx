import { cva, cx } from '@/styled-system/css'

const styles = cva({
  base: {
    borderWidth: '1px',
    borderColor: {
      base: 'rgba(0, 0, 0, 0.04)',
      _dark: 'rgba(255, 255, 255, 0.1)'
    },
    bg: { base: 'rgba(0, 0, 0, 0.03)', _dark: 'rgba(255, 255, 255, 0.1)' },
    overflowWrap: 'break-word',
    fontFamily: 'mono',
    borderRadius: 'md',
    py: '0.5',
    px: '0.25em',
    fontSize: '0.9em'
  },
  variants: {
    hasLineNumbers: {
      true: {
        counterReset: 'line'
      }
    }
  }
})

export const Code = (props: React.ComponentProps<'code'>): JSX.Element => {
  const { className = '', ...rest } = props
  const hasLineNumbers = 'data-line-numbers' in props
  return (
    <code
      className={cx(styles({ hasLineNumbers }), className)}
      dir="ltr"
      {...rest}
    />
  )
}
