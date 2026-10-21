import { css } from 'styled-system/css'

export const layout = css({
  display: 'grid',
  gridTemplateColumns: { base: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 280px' },
  alignItems: 'start',
  gap: '6',
})

export const status = css({ color: 'faint', truncate: true })

export const reset = css({
  h: '6',
  px: '2',
  rounded: 'md',
  fontSize: '12px',
  color: 'muted',
  cursor: 'pointer',
  _hover: { bg: 'selected', color: 'ink' },
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '1px' },
})

export const editor = css({ flex: '1', minH: '0' })

export const editorFallback = css({
  flex: '1',
  m: '0',
  py: '3.5',
  pl: '14',
  fontFamily: 'mono',
  fontSize: '13px',
  lineHeight: '1.75',
  color: 'muted',
  whiteSpace: 'pre-wrap',
})
