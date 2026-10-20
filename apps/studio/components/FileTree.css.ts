import { css } from 'styled-system/css'

export const root = css({ display: 'grid', gap: '2' })

export const tools = css({ display: 'flex', gap: '1' })

export const filter = css({
  flex: '1',
  minW: '0',
  h: '7',
  px: '2',
  rounded: 'md',
  bg: 'paper',
  boxShadow: 'inset',
  fontSize: '12.5px',
  color: 'ink',
  outline: 'none',
  _placeholder: { color: 'faint' },
  _focusVisible: { boxShadow: 'focusHalo' },
})

export const sort = css({
  flexShrink: '0',
  h: '7',
  px: '2',
  rounded: 'md',
  fontSize: '12px',
  color: 'muted',
  cursor: 'pointer',
  _hover: { color: 'ink' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '1px' },
  '&[aria-pressed=true]': { bg: 'selected', color: 'ink' },
})

export const list = css({ display: 'grid', gap: '1px' })

export const row = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
  w: 'full',
  minW: '0',
  h: { base: '9', md: '7' },
  pl: 'calc(var(--depth) * 12px + 10px)',
  pr: '2',
  rounded: 'md',
  fontSize: { base: '14px', md: '12.5px' },
  color: 'muted',
  textAlign: 'left',
  cursor: 'pointer',
  _hover: { bg: 'subtle', color: 'ink' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '-2px' },
  '&[aria-current=page]': { bg: 'selected', color: 'ink', fontWeight: '500' },
})

export const folder = css({ pl: 'calc(var(--depth) * 12px + 2px)', color: 'faint' })

export const chevron = css({
  flexShrink: '0',
  transition: 'transform 0.15s',
  '[aria-expanded=true] > &': { transform: 'rotate(90deg)' },
})

export const name = css({
  flex: '1',
  minW: '0',
  truncate: true,
  '&[data-path]': { direction: 'rtl', textAlign: 'left' },
})

export const count = css({
  flexShrink: '0',
  minW: '4',
  px: '1',
  rounded: 'sm',
  fontSize: '11px',
  fontFamily: 'mono',
  textAlign: 'center',
  color: 'danger',
  bg: 'dangerSubtle',
})

export const empty = css({ px: '2.5', py: '1', fontSize: '12.5px', color: 'faint' })

export const srOnly = css({ srOnly: true })
