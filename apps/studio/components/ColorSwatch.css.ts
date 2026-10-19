import { css } from 'styled-system/css'

// Panda extracts statically, so the checkerboard stays a literal rather than a helper call.
const checkerLight =
  'linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)'
const checkerDark =
  'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)'

export const cell = css({
  position: 'relative',
  minW: '0',
  "&:hover [data-scope='popover'][data-part='trigger']": { opacity: '1' },
})

export const contents = css({ display: 'contents' })

export const chip = css({
  display: 'flex',
  overflow: 'hidden',
  h: '68px',
  rounded: 'xl',
  borderWidth: '1px',
  borderColor: 'divider',
  backgroundImage: checkerLight,
  backgroundClip: 'padding-box',
  backgroundSize: '14px 14px',
  backgroundPosition: '0 0, 0 7px, 7px -7px, -7px 0',
  _dark: { backgroundImage: checkerDark },
})

export const band = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  flex: '1',
  minW: '0',
  h: 'full',
  pb: '1.5',
  '&:not(:first-child)': { borderLeftWidth: '1px', borderColor: 'divider' },
})

export const bandLabel = css({
  maxW: 'calc(100% - 8px)',
  px: '1.5',
  rounded: 'sm',
  bg: 'rgba(255,255,255,0.88)',
  boxShadow: '0 0 0 0.5px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
  color: '#171717',
  fontFamily: 'mono',
  fontSize: '10px',
  lineHeight: '16px',
  truncate: true,
  opacity: '0',
  transform: 'translateY(2px)',
  transition: 'opacity 0.15s, transform 0.15s',
  pointerEvents: 'none',
  '[data-part=trigger]:is(:hover, :focus-visible) &': { opacity: '1', transform: 'none' },
})

export const name = css({
  display: 'block',
  mt: '2',
  fontFamily: 'mono',
  fontSize: '12px',
  color: 'ink',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '&[data-copied]': { color: 'success' },
})

export const infoTrigger = css({
  position: 'absolute',
  top: '1.5',
  right: '1.5',
  display: 'grid',
  placeItems: 'center',
  w: '5',
  h: '5',
  rounded: 'md',
  bg: 'paper',
  color: 'muted',
  boxShadow: 'raised',
  opacity: '0',
  cursor: 'pointer',
  transition: 'opacity 0.12s, color 0.12s',
  _hover: { color: 'ink' },
  _focusVisible: { opacity: '1', outline: '2px solid', outlineColor: 'ring', outlineOffset: '1px' },
  '&[data-open]': { opacity: '1', color: 'ink' },
})
