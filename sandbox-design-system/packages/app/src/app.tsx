import { dsButton } from '@sandbox/ds/button'
import { css, cx } from '../styled-system/css'

export const appCard = cx(
  dsButton,
  css({
    color: 'brand',
    padding: '2',
  }),
)
