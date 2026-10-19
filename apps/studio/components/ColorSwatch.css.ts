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
  flex: '1',
  minW: '0',
  h: 'full',
  '&:not(:first-child)': { borderLeftWidth: '1px', borderColor: 'divider' },
})

export const conditions = css({
  display: 'flex',
  gap: '2',
  mt: '1.5',
  fontFamily: 'mono',
  fontSize: '10px',
  color: 'faint',
  '& > span': { flex: '1', minW: '0', overflow: 'hidden', textOverflow: 'ellipsis' },
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
