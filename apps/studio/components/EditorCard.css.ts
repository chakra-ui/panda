import { css } from 'styled-system/css'

export const card = css({
  display: 'flex',
  flexDir: 'column',
  minH: '420px',
  h: { lg: 'min(560px, calc(100dvh - 320px))' },
  bg: 'paper',
  rounded: '2xl',
  boxShadow: 'raised',
  overflow: 'hidden',
  _focusWithin: { boxShadow: '{shadows.raised}, {shadows.focusHalo}' },
})

export const bar = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexShrink: '0',
  h: '11',
  pl: '4',
  pr: '2',
  borderBottomWidth: '1px',
  borderColor: 'divider',
  fontSize: '12px',
})

export const title = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  minW: '0',
  fontFamily: 'mono',
  color: 'ink',
  truncate: true,
  _before: { content: '""', flexShrink: '0', w: '1.5', h: '1.5', rounded: 'full', bg: 'accent' },
})

export const actions = css({ display: 'flex', alignItems: 'center', gap: '1', ml: 'auto', flexShrink: '0' })
