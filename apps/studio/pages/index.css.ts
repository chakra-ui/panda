import { css, cva } from 'styled-system/css'

export const page = css({
  position: 'relative',
  display: 'flex',
  flexDir: 'column',
  minH: '100dvh',
  bg: 'canvas',
})

export const top = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '3',
  px: { base: '4', md: '6' },
  h: '14',
})

export const topLink = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  fontSize: '13px',
  color: 'muted',
  rounded: 'md',
  _hover: { color: 'ink' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '2px' },
})

export const center = css({
  flex: '1',
  display: 'flex',
  flexDir: 'column',
  alignItems: 'center',
  w: 'full',
  maxW: '600px',
  mx: 'auto',
  px: '4',
  pt: { base: '12', md: '[18vh]' },
  pb: '16',
  textAlign: 'center',
})

export const title = css({
  mt: '8',
  fontSize: { base: '28px', md: '36px' },
  fontWeight: '600',
  lineHeight: '1.15',
  letterSpacing: '-0.025em',
  textWrap: 'balance',
})

export const lede = css({
  mt: '3',
  fontSize: '15px',
  color: 'muted',
  textWrap: 'balance',
  '& code': { fontFamily: 'mono', fontSize: '13px', color: 'ink' },
})

export const composer = css({
  mt: '8',
  w: 'full',
  display: 'flex',
  flexDir: 'column',
  bg: 'paper',
  rounded: '2xl',
  boxShadow: 'raised',
  textAlign: 'left',
  transition: 'box-shadow 0.15s',
  _focusWithin: { boxShadow: '{shadows.raised}, {shadows.focusHalo}' },
  '&[data-invalid]': { boxShadow: 'raised, 0 0 0 1px token(colors.danger)' },
})

export const input = css({
  w: 'full',
  minH: 'calc(3lh + 18px)',
  maxH: '240px',
  resize: 'none',
  px: '4',
  pt: '3.5',
  pb: '1',
  bg: 'transparent',
  border: 'none',
  outline: 'none',
  fontFamily: 'body',
  fontSize: '15px',
  lineHeight: '1.5',
  color: 'ink',
  fieldSizing: 'content',
  _placeholder: { color: 'faint' },
  '&[data-json]': { fontFamily: 'mono', fontSize: '12.5px', lineHeight: '1.6', color: 'muted' },
})

export const composerBar = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  p: '2',
  pl: '2.5',
})

export const attach = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  h: '8',
  px: '2',
  rounded: 'lg',
  fontSize: '13px',
  color: 'muted',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
  _hover: { bg: 'subtle', color: 'ink' },
  _focusWithin: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '1px' },
})

export const actions = css({ display: 'flex', alignItems: 'center', gap: '2.5', ml: 'auto' })

export const kind = css({
  fontFamily: 'mono',
  fontSize: '11px',
  color: 'faint',
})

export const send = css({
  display: 'grid',
  placeItems: 'center',
  w: '8',
  h: '8',
  rounded: 'full',
  bg: 'solid',
  color: 'canvas',
  cursor: 'pointer',
  transition: 'opacity 0.15s',
  _disabled: { opacity: '0.25', cursor: 'default' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '2px' },
})

export const error = css({
  minH: '5',
  mt: '2',
  fontSize: '13px',
  color: 'danger',
  textWrap: 'balance',
})

export const chips = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '2',
  mt: '2',
})

export const chip = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.5',
    h: '8',
    px: '3',
    rounded: 'full',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '2px' },
  },
  variants: {
    tone: {
      neutral: { bg: 'subtle', color: 'muted', _hover: { bg: 'selected', color: 'ink' } },
      accent: {
        bg: 'accent',
        color: 'onAccent',
        fontWeight: '500',
        boxShadow: 'buttonPrimary',
        _hover: { bg: 'accentHover' },
      },
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export const footnote = css({ mt: '6', fontSize: '12px', color: 'faint' })

export const command = css({ fontFamily: 'mono', fontSize: '12px' })

export const prompt = css({ color: 'faint' })

export const strip = css({
  flexShrink: '0',
  h: '80px',
  mb: { base: '10', md: '16' },
  bgImage: 'linear-gradient(90deg, transparent, token(colors.accent) 50%, transparent)',
  maskImage: 'repeating-linear-gradient(to bottom, #000 0 16px, transparent 16px 32px)',
  _dark: { opacity: '0.75' },
})

export const srOnly = css({ srOnly: true })

export const dropOverlay = css({
  position: 'fixed',
  inset: '0',
  zIndex: '50',
  display: 'grid',
  placeItems: 'center',
  bg: 'color-mix(in srgb, token(colors.canvas) 80%, transparent)',
  backdropFilter: 'blur(2px)',
  outline: '2px dashed token(colors.lineStrong)',
  outlineOffset: '-12px',
  pointerEvents: 'none',
})

export const dropCard = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  px: '4',
  h: '10',
  rounded: 'full',
  bg: 'paper',
  boxShadow: 'raised',
  fontSize: '14px',
  fontWeight: '500',
})
