import { css, cx } from '../../__generated__/css'
import React from 'react'

export function Card({ className }) {
  return (
    <div
      className={cx(
        'card',
        css({
          background: 'white',
          '--bg': 'colors.red.200',
        }),
        className,
      )}
    >
      <div></div>
    </div>
  )
}
