import { css } from 'styled-system/css'

export const layout = css({
  display: 'grid',
  gridTemplateColumns: { base: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 280px' },
  alignItems: 'start',
  gap: '6',
})

export const editor = css({ flex: '1', minH: '0' })

export const readonly = css({ px: '2', fontSize: '12px', color: 'faint' })

export const reportOnly = css({ display: 'grid', gap: '6', maxW: '480px' })

export const notice = css({ fontSize: '13px', color: 'muted', textWrap: 'pretty' })
