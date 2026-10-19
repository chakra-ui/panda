import { css } from 'styled-system/css'

export const root = css({ display: 'contents' })

export const tabs = css({
  display: 'flex',
  flexDir: 'column',
  gap: '1',
})

export const tab = css({ justifyContent: 'space-between', w: 'full', scrollMarginBlock: '6' })

export const count = css({ fontSize: { base: '13px', md: '12px' }, fontWeight: '400', color: 'faint' })

export const toolbar = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  mb: '6',
})

export const field = css({ flex: '1', minW: '220px' })

export const filter = css({ position: 'relative' })

export const filterIcon = css({
  position: 'absolute',
  left: '2.5',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'faint',
  pointerEvents: 'none',
})

export const filterInput = css({ pl: '8' })

export const stepper = css({ display: 'inline-flex', gap: '1', ml: { sm: '1' } })

export const fieldFull = css({ flexBasis: '100%' })

export const previewArea = css({ minH: 'auto', fontFamily: 'body', fontSize: '13px' })

export const srOnly = css({ srOnly: true })
