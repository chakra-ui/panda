import { css } from 'styled-system/css'

export const overlay = css({
  position: 'fixed',
  inset: '0',
  zIndex: '50',
  display: 'grid',
  placeItems: 'center',
  bg: 'rgba(0,0,0,0.06)',
  _dark: { bg: 'rgba(0,0,0,0.4)' },
  animation: 'fadeIn 0.2s ease-out',
})

export const card = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  px: '4',
  h: '11',
  rounded: 'xl',
  bg: 'paper',
  boxShadow: 'overlay',
  fontSize: '13px',
  fontWeight: '500',
  animation: 'popIn 0.18s ease-out',
})
