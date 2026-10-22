import { css } from 'styled-system/css'

const inlineCode = { '& code': { fontFamily: 'mono', fontSize: '0.92em', color: 'ink' } } as const

export const root = css({ display: 'grid', gap: '4' })

export const scanning = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3',
  py: '20',
  color: 'muted',
  fontSize: '13px',
})

export const dropzone = css({
  display: 'flex',
  flexDir: 'column',
  alignItems: 'center',
  px: '6',
  py: '12',
  outline: '1.5px dashed transparent',
  outlineOffset: '-8px',
  transition: 'background 0.15s, outline-color 0.15s',
  '&[data-dragging]': { bg: 'subtle', outlineColor: 'lineStrong' },
})

export const label = css({ mb: '3', fontSize: '13px', color: 'muted', textAlign: 'center', textWrap: 'balance' })

export const command = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  w: 'full',
  maxW: '400px',
  h: '9',
  pl: '3',
  pr: '1',
  rounded: 'lg',
  bg: 'canvas',
  boxShadow: 'inset',
  '& code': { fontFamily: 'mono', fontSize: '12.5px', truncate: true },
})

export const prompt = css({ color: 'faint', userSelect: 'none' })

export const open = css({ mt: '4' })

export const dropHint = css({ mt: '3', fontSize: '12.5px', color: 'faint', ...inlineCode })

export const error = css({
  px: '3.5',
  py: '2.5',
  rounded: 'lg',
  bg: 'dangerSubtle',
  color: 'danger',
  fontSize: '13px',
})

export const fallback = css({ fontSize: '13px', color: 'muted', textAlign: 'center', textWrap: 'balance' })

export const link = css({
  color: 'ink',
  fontWeight: '500',
  textDecoration: 'underline',
  textDecorationColor: 'lineStrong',
  textUnderlineOffset: '3px',
  cursor: 'pointer',
  _hover: { textDecorationColor: 'currentColor' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '2px', rounded: 'sm' },
})
