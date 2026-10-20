import { css } from 'styled-system/css'

export const root = css({ display: 'grid', gap: '8' })

export const section = css({ display: 'grid', alignContent: 'start', gap: '3', minW: '0' })

export const sectionHeader = css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3' })

export const heading = css({ fontSize: '13px', fontWeight: '500', color: 'muted' })

export const legend = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  fontSize: '12px',
  color: 'faint',
  '& i:nth-of-type(2)': { ml: '2' },
})

export const empty = css({ fontSize: '13px', color: 'faint' })

export const waffle = css({ display: 'grid', gap: '1' })

export const category = css({
  rounded: 'lg',
  '&[open]': { bg: 'subtle' },
})

export const categoryRow = css({
  display: 'grid',
  gridTemplateColumns: { base: '1fr auto', md: '120px 1fr 56px' },
  alignItems: 'center',
  gap: { base: '2', md: '4' },
  px: '2.5',
  py: '2',
  rounded: 'lg',
  cursor: 'pointer',
  listStyle: 'none',
  '&::-webkit-details-marker': { display: 'none' },
  _hover: { bg: 'subtle' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '-2px' },
})

export const categoryName = css({ fontSize: '13px', color: 'ink', truncate: true })

export const cells = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2px',
  gridColumn: { base: '1 / -1', md: 'auto' },
  gridRow: { base: '2', md: 'auto' },
})

export const cell = css({
  display: 'inline-block',
  w: '8px',
  h: '8px',
  rounded: '2px',
  bg: 'divider',
  '&[data-used]': { bg: 'ink' },
})

export const categoryCount = css({
  fontSize: '12px',
  color: 'faint',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
})

export const unused = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '1.5',
  px: '2.5',
  pb: '3',
  pt: '1',
})

export const unusedLabel = css({ mr: '1', fontSize: '12px', color: 'faint' })

export const chip = css({
  h: '6',
  display: 'inline-flex',
  alignItems: 'center',
  px: '2',
  rounded: 'md',
  bg: 'paper',
  fontFamily: 'mono',
  fontSize: '12px',
  color: 'muted',
})

export const columns = css({
  display: 'grid',
  gridTemplateColumns: { base: '1fr', lg: '1fr 1fr' },
  gap: { base: '8', lg: '10' },
})

export const groups = css({ display: 'grid', gap: '4' })

export const group = css({ display: 'grid', gap: '1' })

export const groupHeading = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: '2',
  fontSize: '12px',
  fontWeight: '500',
  color: 'muted',
})

export const groupCount = css({ fontWeight: '400', color: 'faint', fontVariantNumeric: 'tabular-nums' })

export const bars = css({ display: 'grid', gap: '2px', mx: '-2' })

export const bar = css({
  position: 'relative',
  isolation: 'isolate',
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  h: '7',
  px: '2',
  rounded: 'md',
  overflow: 'hidden',
})

export const barFill = css({
  position: 'absolute',
  insetBlock: '0',
  insetInlineStart: '0',
  zIndex: '-1',
  bg: 'subtle',
  rounded: 'md',
})

export const swatch = css({
  flexShrink: '0',
  w: '2.5',
  h: '2.5',
  rounded: 'sm',
  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
})

export const barLabel = css({ flex: '1', minW: '0', fontFamily: 'mono', fontSize: '12.5px', color: 'ink', truncate: true })

export const barValue = css({
  flexShrink: '0',
  fontSize: '12px',
  color: 'muted',
  fontVariantNumeric: 'tabular-nums',
})

export const issues = css({ display: 'grid', gap: '1px', mx: '-2' })

export const issue = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  h: '7',
  px: '2',
  rounded: 'md',
  minW: '0',
  _hover: { bg: 'subtle' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '-2px' },
})

export const dot = css({
  w: '1.5',
  h: '1.5',
  flexShrink: '0',
  rounded: 'full',
  '&[data-tone=danger]': { bg: 'danger' },
  '&[data-tone=warning]': { bg: 'code.number' },
})

export const issueValue = css({ fontFamily: 'mono', fontSize: '12.5px', color: 'ink', truncate: true })

export const issueWhere = css({ fontSize: '12px', color: 'faint', truncate: true })

export const issueFix = css({
  ml: 'auto',
  flexShrink: '0',
  maxW: '45%',
  fontFamily: 'mono',
  fontSize: '12px',
  color: 'muted',
  truncate: true,
})

export const more = css({
  justifySelf: 'start',
  h: '7',
  px: '2',
  mx: '-2',
  rounded: 'md',
  fontSize: '12.5px',
  color: 'muted',
  cursor: 'pointer',
  _hover: { bg: 'subtle', color: 'ink' },
})
