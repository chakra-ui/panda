import { css, cx } from '@/styled-system/css'

const styles = css({
  borderBottomWidth: '1px',
  borderColor: 'border',
  '& > summary': {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '3',
    cursor: 'pointer',
    listStyle: 'none',
    py: '4',
    fontWeight: 'medium',
    lineHeight: '1.5',
    color: 'fg.muted',
    transitionProperty: 'color',
    transitionDuration: '150ms',
    _hover: { color: 'fg' },
    '&::-webkit-details-marker': { display: 'none' },
    _before: {
      content: '"+"',
      flexShrink: '0',
      width: '1rem',
      fontFamily: 'mono',
      color: 'fg.subtle',
      textAlign: 'center'
    }
  },
  '&[open] > summary': {
    color: 'fg',
    _before: { content: '"\\2212"' }
  },
  '& > summary + *': { mt: '0' },
  '&[open] > *:not(summary)': { textStyle: 'sm', color: 'fg.muted' },
  '&[open] > *:last-child': { mb: '5' }
})

export const Details = (props: React.ComponentProps<'details'>) => {
  const { className, ...rest } = props
  return <details className={cx(styles, className)} {...rest} />
}

const faqStyles = css({
  my: '6',
  borderTopWidth: '1px',
  borderColor: 'border'
})

export const Faq = (props: React.ComponentProps<'div'>) => {
  const { className, ...rest } = props
  return <div className={cx(faqStyles, className)} {...rest} />
}
