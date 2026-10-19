import { css } from 'styled-system/css'

export const error = css({
  mb: '8',
  px: '3.5',
  py: '2.5',
  rounded: 'lg',
  bg: 'dangerSubtle',
  color: 'danger',
  fontSize: '13px',
  lineHeight: '1.5',
})

export const dropzone = css({
  display: 'flex',
  flexDir: 'column',
  alignItems: 'center',
  textAlign: 'center',
  px: '6',
  py: '12',
  transition: 'background 0.15s, outline-color 0.15s',
  outline: '1.5px dashed transparent',
  outlineOffset: '-8px',
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
  boxShadow: 'raised',
})

export const dropTitle = css({
  fontSize: '14px',
  fontWeight: '500',
  textWrap: 'balance',
  '& code': { fontFamily: 'mono', fontSize: '13px' },
})

export const dropHint = css({
  mt: '1',
  fontSize: '13px',
  color: 'muted',
  textWrap: 'balance',
  '& code': { fontFamily: 'mono', fontSize: '12px' },
})

export const dropActions = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '2',
  mt: '6',
})

export const commandText = css({ fontFamily: 'mono', fontSize: '13px' })

export const prompt = css({ color: 'faint', userSelect: 'none' })

export const pasteField = css({ display: 'grid', gap: '3', p: '4' })

export const pasteLabel = css({ fontSize: '13px', fontWeight: '500' })

export const pasteSubmit = css({ justifySelf: 'flex-start' })

export const getOne = css({ mt: '12' })

export const command = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  pl: '4',
  pr: '2',
  h: '12',
})
