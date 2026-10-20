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
    fontFamily: 'mono',
    fontSize: '20px',
    fontWeight: '500',
    letterSpacing: '-0.04em',
    color: 'ink',
  },
  '&[data-tone=danger] dd': { color: 'danger' },
  '&[data-tone=warning] dd': { color: 'code.number' },
})

export const total = css({ ml: '0.5', fontSize: '13px', fontWeight: '400', letterSpacing: '0', color: 'faint' })
