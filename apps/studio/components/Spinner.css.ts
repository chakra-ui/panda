import { css } from 'styled-system/css'

export const spinner = css({
  display: 'inline-block',
  flexShrink: 0,
  w: '4',
  h: '4',
  rounded: 'full',
  borderWidth: '2px',
  borderColor: 'lineStrong',
  borderTopColor: 'ink',
  animation: 'spin 0.7s linear infinite',
})
