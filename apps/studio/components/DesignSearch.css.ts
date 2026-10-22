import { css } from 'styled-system/css'

export const trigger = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  w: 'full',
  h: '8',
  px: '2.5',
  rounded: 'lg',
  bg: 'paper',
  boxShadow: 'inset',
  color: 'faint',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'color 0.15s, box-shadow 0.15s',
  _hover: { color: 'muted' },
  _focusVisible: { outline: 'none', boxShadow: 'focusHalo' },
})

export const triggerLabel = css({ flex: '1', textAlign: 'left' })

export const triggerKbd = css({ display: { base: 'none', md: 'inline-grid' } })

export const kbd = css({
  display: 'inline-grid',
  placeItems: 'center',
  minW: '4',
  h: '4',
  px: '1',
  rounded: 'sm',
  bg: 'selected',
  fontFamily: 'body',
  fontSize: '11px',
  fontWeight: '500',
  color: 'muted',
  '& + &': { ml: '0.5' },
})

export const backdrop = css({
  position: 'fixed',
  inset: '0',
  zIndex: '50',
  bg: 'rgba(0,0,0,0.12)',
  _dark: { bg: 'rgba(0,0,0,0.5)' },
  '&[data-state=open]': { animation: 'fadeIn 0.12s ease-out' },
})

export const positioner = css({
  position: 'fixed',
  inset: '0',
  zIndex: '50',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  pt: { base: '4', md: '14vh' },
  px: '4',
})

export const content = css({
  display: 'flex',
  flexDir: 'column',
  w: 'full',
  maxW: '620px',
  maxH: { base: 'calc(100dvh - 2rem)', md: 'min(560px, 72vh)' },
  overflow: 'hidden',
  rounded: '2xl',
  bg: 'paper',
  boxShadow: 'overlay',
  outline: 'none',
  '&[data-state=open]': { animation: 'popIn 0.14s ease-out' },
})

export const control = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2.5',
  h: '12',
  px: '4',
})

export const inputIcon = css({ color: 'faint' })

export const input = css({
  flex: '1',
  h: 'full',
  bg: 'transparent',
  outline: 'none',
  fontSize: '14px',
  color: 'ink',
  _placeholder: { color: 'faint' },
})

export const results = css({
  flex: '1',
  minH: '0',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  p: '1.5',
  outline: 'none',
})

export const empty = css({ px: '3', py: '10', textAlign: 'center', fontSize: '13px', color: 'muted' })

export const group = css({ '& + &': { mt: '2' } })

export const groupLabel = css({
  px: '2.5',
  pt: '1.5',
  pb: '1',
  fontSize: '12px',
  fontWeight: '500',
  color: 'faint',
})

export const item = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2.5',
  minH: '9',
  px: '2.5',
  py: '1.5',
  rounded: 'lg',
  cursor: 'pointer',
  '&[data-highlighted]': { bg: 'selected' },
})

export const swatch = css({
  flexShrink: 0,
  w: '4',
  h: '4',
  rounded: 'sm',
  boxShadow: 'inset 0 0 0 1px {colors.line}',
  '&[data-empty]': { visibility: 'hidden' },
})

export const itemText = css({
  display: 'grid',
  flex: '1',
  minW: '0',
  '& mark': { bg: 'accentSubtle', color: 'ink', rounded: '2px' },
})

export const itemLabel = css({
  fontFamily: 'mono',
  fontSize: '12.5px',
  color: 'ink',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const itemMatch = css({
  fontFamily: 'mono',
  fontSize: '11.5px',
  color: 'muted',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const matchField = css({ fontFamily: 'body', color: 'faint', mr: '1.5' })

export const itemMeta = css({ flexShrink: 0, fontSize: '12px', color: 'faint' })

export const footer = css({
  display: { base: 'none', md: 'flex' },
  alignItems: 'center',
  gap: '4',
  h: '9',
  px: '4',
  bg: 'subtle',
  fontSize: '12px',
  color: 'faint',
  '& > span': { display: 'inline-flex', alignItems: 'center', gap: '1' },
})

export const count = css({ ml: 'auto' })
