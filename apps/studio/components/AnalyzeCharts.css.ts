import { css } from 'styled-system/css'

export const grid = css({
  display: 'grid',
  gridTemplateColumns: { base: '1fr', md: '0.8fr 1.2fr' },
  gap: '4',
  mb: '5',
})

export const card = css({
  p: '5',
  rounded: '2xl',
  bg: 'paper',
  boxShadow: 'raised',
  display: 'flex',
  flexDir: 'column',
  gap: '1',
})

export const head = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
})

export const title = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: '14px',
  fontWeight: '600',
})

export const icon = css({ color: 'muted' })

export const meta = css({ fontSize: '12px', color: 'faint' })

export const stat = css({
  fontSize: '36px',
  fontWeight: '600',
  letterSpacing: '-0.03em',
  lineHeight: '1',
  mt: '3',
})

export const statMono = css({
  fontFamily: 'mono',
  fontSize: '22px',
  fontWeight: '500',
  letterSpacing: '-0.01em',
  lineHeight: '1.1',
  mt: '3',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const statSub = css({ fontSize: '12.5px', color: 'muted', mt: '1.5' })

export const donutBox = css({ h: '180px', mt: '1' })

export const barBox = css({ mt: '2' })
