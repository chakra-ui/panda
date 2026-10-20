import { css } from 'styled-system/css'

export const panel = css({ display: 'grid', alignContent: 'start', gap: '5', minW: '0' })

export const srOnly = css({ srOnly: true })

export const empty = css({ py: '1', fontSize: '13px', color: 'faint', textWrap: 'pretty' })

export const tabs = css({ display: 'grid', gap: '2', minW: '0' })

export const tabList = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.5',
  p: '2px',
  rounded: 'lg',
  bg: 'selected',
})

export const tab = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5',
  h: '6',
  px: '2.5',
  rounded: 'md',
  fontSize: '12.5px',
  fontWeight: '500',
  color: 'muted',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
  _hover: { color: 'ink' },
  _selected: { bg: 'paper', color: 'ink', boxShadow: 'raised' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '1px' },
})

export const tabCount = css({ fontSize: '11.5px', color: 'faint', fontVariantNumeric: 'tabular-nums' })

export const fixAll = css({
  display: 'block',
  ml: 'auto',
  mb: '1',
  h: '6',
  px: '2',
  rounded: 'md',
  fontSize: '12px',
  fontWeight: '500',
  color: 'ink',
  cursor: 'pointer',
  _hover: { bg: 'subtle' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '1px' },
})

export const content = css({ minW: '0', pt: '1', _focusVisible: { outline: 'none' } })

export const list = css({
  display: 'grid',
  maxH: { base: '320px', lg: 'min(420px, calc(100dvh - 420px))' },
  overflowY: 'auto',
  mx: '-2',
  overscrollBehavior: 'contain',
})

export const row = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  minW: '0',
  rounded: 'md',
  _hover: { bg: 'subtle' },
})

export const target = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flex: '1',
  minW: '0',
  h: '7',
  px: '2',
  rounded: 'md',
  textAlign: 'left',
  cursor: 'pointer',
  _disabled: { cursor: 'default' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '-2px' },
})

export const dot = css({
  w: '1.5',
  h: '1.5',
  mx: '0.5',
  flexShrink: '0',
  rounded: 'full',
  bg: 'lineStrong',
  '&[data-tone=danger]': { bg: 'danger' },
  '&[data-tone=warning]': { bg: 'code.number' },
})

export const swatch = css({
  w: '2.5',
  h: '2.5',
  flexShrink: '0',
  rounded: 'sm',
  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
})

export const line = css({
  minW: '3ch',
  fontFamily: 'mono',
  fontSize: '11.5px',
  color: 'faint',
  fontVariantNumeric: 'tabular-nums',
})

export const value = css({ fontFamily: 'mono', fontSize: '12.5px', color: 'ink', truncate: true })

export const meta = css({ fontSize: '12px', color: 'faint', truncate: true })

export const aside = css({
  flexShrink: '0',
  maxW: '50%',
  px: '2',
  fontFamily: 'mono',
  fontSize: '12px',
  color: 'muted',
  fontVariantNumeric: 'tabular-nums',
  truncate: true,
})

export const fix = css({
  flexShrink: '0',
  maxW: '50%',
  h: '6',
  mr: '0.5',
  px: '2',
  rounded: 'md',
  fontFamily: 'mono',
  fontSize: '12px',
  color: 'muted',
  truncate: true,
  cursor: 'pointer',
  _hover: { bg: 'paper', color: 'ink', boxShadow: 'button' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '1px' },
})
