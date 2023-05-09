import type { ComponentProps } from 'react'
import { css, cx } from '../../styled-system/css'

export const Table = ({
  className = '',
  ...props
}: ComponentProps<'table'>) => (
  <table
    className={cx(css({ display: 'block', overflowX: 'scroll' }), className)}
    {...props}
  />
)
