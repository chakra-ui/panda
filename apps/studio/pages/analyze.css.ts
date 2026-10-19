import { css } from 'styled-system/css'

const inlineCode = { '& code': { fontFamily: 'mono', fontSize: '0.92em', color: 'ink' } } as const

export const analyzing = css({
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
  textAlign: 'center',
  px: '6',
  py: '12',
  outline: '1.5px dashed transparent',
  outlineOffset: '-8px',
  transition: 'background 0.15s, outline-color 0.15s',
  '&[data-dragging]': { bg: 'subtle', outlineColor: 'lineStrong' },
})

export const dropIcon = css({
  display: 'grid',
  placeItems: 'center',
  w: '9',
  h: '9',
  mb: '4',
  rounded: 'lg',
  bg: 'paper',
  color: 'muted',
  boxShadow: 'button',
})

export const dropTitle = css({ fontSize: '14px', fontWeight: '500' })

export const dropHint = css({ mt: '1', fontSize: '13px', color: 'muted', textWrap: 'balance' })

export const dropAction = css({ mt: '6' })

export const notice = css({
  mt: '4',
  px: '3.5',
  py: '2.5',
  rounded: 'lg',
  bg: 'warningSubtle',
  fontSize: '13px',
  lineHeight: '1.55',
  color: 'muted',
  ...inlineCode,
  '& strong': { color: 'ink', fontWeight: '600' },
})

export const hint = css({ mb: '4', fontSize: '13px', color: 'faint', ...inlineCode })

export const scanned = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  mb: '5',
  fontSize: '13px',
  color: 'muted',
})

export const badge = css({
  px: '2',
  h: '5',
  display: 'inline-flex',
  alignItems: 'center',
  rounded: 'full',
  bg: 'selected',
  fontSize: '11.5px',
  fontWeight: '500',
  color: 'muted',
  '&[data-precise]': { bg: 'accent', color: 'onAccent' },
})
