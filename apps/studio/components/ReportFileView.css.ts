import { css } from 'styled-system/css'

export const root = css({ display: 'grid', gap: '4' })

export const body = css({ display: 'grid', gap: '4', p: '2' })

export const empty = css({ px: '2', py: '3', fontSize: '13px', color: 'muted' })

export const list = css({ display: 'grid', gap: '2px' })

export const row = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  minW: '0',
  h: '9',
  pl: '2',
  pr: '1',
  rounded: 'lg',
  bg: 'paper',
  boxShadow: 'raised',
})

export const position = css({
  flexShrink: '0',
  minW: '6ch',
  fontFamily: 'mono',
  fontSize: '12px',
  color: 'faint',
  fontVariantNumeric: 'tabular-nums',
})

export const dot = css({
  w: '1.5',
  h: '1.5',
  flexShrink: '0',
  rounded: 'full',
  '&[data-tone=danger]': { bg: 'danger' },
  '&[data-tone=warning]': { bg: 'code.number' },
})

export const value = css({ flexShrink: '0', maxW: '40%', fontFamily: 'mono', fontSize: '12.5px', truncate: true })

export const meta = css({ flex: '1', minW: '0', fontSize: '12.5px', color: 'faint', truncate: true })

export const replacement = css({
  flexShrink: '0',
  maxW: '30%',
  fontFamily: 'mono',
  fontSize: '12px',
  color: 'muted',
  truncate: true,
})

export const open = css({ flexShrink: '0', h: '7', w: '7', color: 'faint' })

export const used = css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5', px: '2', pb: '1' })

export const usedLabel = css({ mr: '1', fontSize: '12px', color: 'faint' })

export const chip = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  h: '6',
  px: '2',
  rounded: 'md',
  bg: 'paper',
  fontFamily: 'mono',
  fontSize: '12px',
  color: 'muted',
})

export const chipCount = css({ color: 'faint', fontVariantNumeric: 'tabular-nums' })

export const swatch = css({
  w: '2',
  h: '2',
  flexShrink: '0',
  rounded: 'sm',
  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
})

export const attach = css({ ml: 'auto', flexShrink: '0' })

export const error = css({
  px: '3.5',
  py: '2.5',
  rounded: 'lg',
  bg: 'dangerSubtle',
  color: 'danger',
  fontSize: '13px',
})
