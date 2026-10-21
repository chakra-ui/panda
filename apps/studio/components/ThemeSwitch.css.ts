import { css } from 'styled-system/css'

export const root = css({
  position: 'relative',
  display: 'flex',
  gap: '0.5',
  w: '84px',
  h: '7',
  p: '2px',
  rounded: 'full',
  boxShadow: 'inset',
})

export const indicator = css({
  position: 'absolute',
  top: 'var(--top)',
  left: 'var(--left)',
  w: 'var(--width)',
  h: 'var(--height)',
  rounded: 'full',
  bg: 'selected',
  transition: 'left 0.2s ease',
})

export const item = css({
  position: 'relative',
  zIndex: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '1',
  rounded: 'full',
  color: 'faint',
  cursor: 'pointer',
  transition: 'color 0.15s',
  _hover: { color: 'ink' },
  '&[data-state=checked]': { color: 'ink' },
  '&:has(:focus-visible)': { boxShadow: 'focusHalo' },
})

export const label = css({ srOnly: true })
