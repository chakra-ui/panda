import { css, cx } from '@/styled-system/css'

const styles = css({
  ms: '4',
  mb: '12',
  borderInlineStartWidth: '1px',
  borderColor: { base: 'gray.200', _dark: 'neutral.800' },
  ps: '6',
  counterReset: 'step',
  '& > h3': {
    counterIncrement: 'step',
    _before: {
      h: '8',
      w: '8',
      borderWidth: '4px',
      borderColor: { base: 'white', _dark: 'rgba(17,17,17,1)' },
      bg: 'yellow.300',
      position: 'absolute',
      textAlign: 'center',
      textIndent: '-1px',
      color: 'black',
      content: 'counter(step)',
      borderRadius: 'lg',
      mt: '1px',
      ml: '-41px',
      fontSize: 'md',
      fontWeight: 'bold',
      lineHeight: 'relaxed'
    }
  }
})

export const Steps = (props: React.ComponentProps<'div'>) => {
  const { children, className, ...rest } = props
  return (
    <div className={cx('nextra-steps', styles, className)} {...rest}>
      {children}
    </div>
  )
}
