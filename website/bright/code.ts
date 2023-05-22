import { Code } from 'bright'
import gruvBoxTheme from '../gruvbox-theme.cjs'
import { css } from '../styled-system/css'

Code.theme = gruvBoxTheme

export { Code }

export const codeStyle = css({
  padding: '4',
  fontFamily: 'mono',
  fontSize: 'md',
  lineHeight: '1.7',
  fontWeight: '500'
})
