import { css, cx, cssMap } from '../../__generated__/css'
import React from 'react'

const base = css({
  fontSize: 'lg',
  fontFamily: 'body',
  paddingX: '6',
  paddingY: '4',
  borderRadius: 'md',
})

const variants = cssMap({
  warning: {
    background: '#fffaf2',
    color: '#996a13',
    border: '1px solid #ffb020',
  },
  error: {
    background: '#FDF4F4',
    color: '#a73636',
    border: '1px solid #d14343',
  },
})

export function Alert() {
  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: '5' })}>
      <div className={cx(base, variants('warning'))}>Hello</div>
      <div className={cx(base, variants('error'))}>Hello</div>
    </div>
  )
}
