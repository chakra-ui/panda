import { css } from 'styled-system/css'

export const contents = css({ display: 'contents' })

export const card = css({
  display: 'flex',
  flexDir: 'column',
  bg: 'paper',
  rounded: '2xl',
  boxShadow: 'raised',
  overflow: 'hidden',
})

export const row = css({
  display: 'grid',
  gridTemplateColumns: { base: 'auto minmax(0, 1fr)', sm: '96px minmax(0, 1fr) auto' },
  alignItems: 'center',
  gap: { base: '2', sm: '6' },
  px: '5',
  py: '4',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background 0.12s',
  outline: '2px solid transparent',
  outlineOffset: '-2px',
  _hover: { bg: 'canvas' },
  '&:is(:focus-visible, [data-focused])': { outlineColor: 'ring' },
  '&[data-leading]': { alignItems: 'start', py: '5' },
  '& + &': { borderTopWidth: '1px', borderColor: 'line' },
})

export const name = css({
  fontFamily: 'mono',
  fontSize: '13px',
  color: 'ink',
  truncate: true,
  '&[data-copied]': { color: 'success' },
})

export const value = css({
  fontFamily: 'mono',
  fontSize: '11.5px',
  color: 'faint',
  textAlign: 'right',
  whiteSpace: 'nowrap',
  gridColumn: { base: '2', sm: 'auto' },
  gridRow: { base: '1', sm: 'auto' },
})

export const line = css({
  minW: '0',
  gridColumn: { base: '1 / -1', sm: 'auto' },
  fontSize: '20px',
  lineHeight: '1.25',
  color: 'ink',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  maskImage: 'linear-gradient(to right, #000 calc(100% - 40px), transparent)',
})

export const paragraph = css({
  gridColumn: { base: '1 / -1', sm: 'auto' },
  maxW: '480px',
  fontSize: '15px',
  color: 'ink',
  backgroundImage:
    'repeating-linear-gradient(to bottom, transparent 0, transparent calc(1lh - 1px), {colors.subtle} calc(1lh - 1px), {colors.subtle} 1lh)',
})
