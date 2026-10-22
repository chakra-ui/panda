import { css } from 'styled-system/css'

export const header = css({
  display: 'flex',
  flexDir: { base: 'column', xl: 'row' },
  alignItems: { base: 'flex-start', xl: 'flex-end' },
  justifyContent: 'space-between',
  gap: '5',
})

export const text = css({ display: 'grid', gap: '3', minW: '0', flex: '1', w: 'full' })

export const title = css({
  fontSize: { base: '28px', md: '36px' },
  fontWeight: '600',
  letterSpacing: '-0.035em',
  lineHeight: '1.1',
  textWrap: 'pretty',
})

export const description = css({
  maxW: '600px',
  fontSize: { base: '15px', md: '17px' },
  lineHeight: '1.55',
  color: 'muted',
  textWrap: 'pretty',
  '& code': { fontFamily: 'mono', fontSize: '0.88em', color: 'ink' },
})

export const actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flexShrink: 0,
  flexWrap: { base: 'wrap', xl: 'nowrap' },
})
