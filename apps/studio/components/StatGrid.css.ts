import { css } from 'styled-system/css'

export const grid = css({
  display: 'grid',
  gridTemplateColumns: { base: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(var(--columns), minmax(0, 1fr))' },
  gap: '2',
})

export const stat = css({
  display: 'grid',
  gap: '1',
  p: '3',
  rounded: 'xl',
  bg: 'paper',
  boxShadow: 'raised',
  '& dt': { fontSize: '12px', color: 'faint' },
  '& dd': {
    fontSize: '20px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    color: 'ink',
    fontVariantNumeric: 'tabular-nums',
  },
  '&[data-tone=danger] dd': { color: 'danger' },
  '&[data-tone=warning] dd': { color: 'code.number' },
})
