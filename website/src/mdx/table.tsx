import { css, cx } from '@/styled-system/css'

/* -----------------------------------------------------------------------------
 * Table
 * -----------------------------------------------------------------------------*/

const tableStyles = css({
  display: 'block',
  overflowX: 'auto',
  mt: { base: '6', _first: '0' },
  p: '0'
})

export const Table = ({
  className = '',
  ...props
}: React.ComponentProps<'table'>) => (
  <table className={cx('scroll-area', tableStyles, className)} {...props} />
)

/* -----------------------------------------------------------------------------
 * Table Head
 * -----------------------------------------------------------------------------*/

const thStyles = css({
  m: '0',
  borderWidth: '1px',
  borderColor: 'border',
  px: '4',
  py: '2',
  fontWeight: 'semibold'
})

export const Th = ({
  className = '',
  ...props
}: React.ComponentProps<'th'>) => (
  <th className={cx(thStyles, className)} {...props} />
)

/* -----------------------------------------------------------------------------
 * Table Row
 * -----------------------------------------------------------------------------*/

const trStyles = css({
  m: '0',
  p: '0',
  borderWidth: '1px',
  borderColor: 'border',
  _even: {
    bg: 'bg.subtle'
  }
})

export const Tr = ({
  className = '',
  ...props
}: React.ComponentProps<'tr'>) => (
  <tr className={cx(trStyles, className)} {...props} />
)

/* -----------------------------------------------------------------------------
 * Table Cell
 * -----------------------------------------------------------------------------*/

const tdStyles = css({
  m: '0',
  borderWidth: '1px',
  borderColor: 'border',
  px: '4',
  py: '2'
})

export const Td = ({
  className = '',
  ...props
}: React.ComponentProps<'td'>) => (
  <td className={cx(tdStyles, className)} {...props} />
)
