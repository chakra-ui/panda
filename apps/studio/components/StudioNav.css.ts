import { css } from 'styled-system/css'

export const nav = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.5',
  p: '2px',
  rounded: 'lg',
  bg: 'selected',
})

export const link = css({
  display: 'grid',
  placeItems: 'center',
  h: { base: '9', md: '7' },
  rounded: 'md',
  fontSize: '13px',
  fontWeight: '500',
  color: 'muted',
  transition: 'background 0.15s, color 0.15s',
  _hover: { color: 'ink' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '1px' },
  '&[aria-current=page]': { bg: 'paper', color: 'ink', boxShadow: 'raised' },
})
