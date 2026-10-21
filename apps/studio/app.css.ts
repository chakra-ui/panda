import { css } from 'styled-system/css'

export const skipLink = css({
  position: 'fixed',
  top: '3',
  left: '3',
  zIndex: '60',
  px: '3',
  py: '2',
  rounded: 'lg',
  bg: 'paper',
  boxShadow: 'overlay',
  fontSize: '13px',
  fontWeight: '500',
  transform: 'translateY(-200%)',
  _focusVisible: { transform: 'none', outline: '2px solid', outlineColor: 'ring', outlineOffset: '2px' },
})

export const toast = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  px: '3.5',
  h: '9',
  rounded: 'lg',
  bg: 'paper',
  color: 'ink',
  boxShadow: 'overlay',
  fontSize: '13px',
  fontWeight: '500',
  whiteSpace: 'nowrap',
  opacity: 'var(--opacity, 1)',
  transition: 'opacity 0.2s ease, translate 0.2s ease',
  "&[data-state='closed']": { opacity: '0' },
  "&[data-type='error']": { color: 'danger' },
})
