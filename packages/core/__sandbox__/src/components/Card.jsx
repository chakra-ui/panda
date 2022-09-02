import { css, cssMap } from '../../__generated__/css'
import React from 'react'

const base = css({
  userSelect: 'none',
  position: 'sticky',
  color: 'red.200',
})

const sheet = cssMap({
  primary: { background: 'blue' },
  secondary: { background: 'aqua' },
})

export function Card() {
  return (
    <div className={sheet('primary')}>
      <div className={base}>Welcome</div>
    </div>
  )
}
