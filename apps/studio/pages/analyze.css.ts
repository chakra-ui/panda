import { css } from 'styled-system/css'

export const mode = css({ gap: '2', w: 'full', '& svg': { color: 'faint' } })

export const notice = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '2',
  mb: '6',
  px: '3.5',
  py: '2.5',
  rounded: 'lg',
  bg: 'warningSubtle',
  fontSize: '13px',
  color: 'ink',
  textWrap: 'pretty',
  '& svg': { flexShrink: '0', mt: '0.5', color: 'code.number' },
  '& code': { fontFamily: 'mono', fontSize: '0.92em' },
})
