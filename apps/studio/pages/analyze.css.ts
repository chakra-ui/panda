import { css } from 'styled-system/css'

export const mode = css({ gap: '2', w: 'full', '& svg': { color: 'faint' } })

export const status = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  h: '7',
  px: '2.5',
  rounded: 'full',
  bg: 'subtle',
  fontSize: '12.5px',
  fontWeight: '500',
  color: 'muted',
  '& i': { w: '1.5', h: '1.5', rounded: 'full', bg: 'faint' },
  '&[data-live]': {
    color: 'ink',
    '& i': { bg: 'success', boxShadow: '0 0 0 3px color-mix(in srgb, token(colors.success) 20%, transparent)' },
  },
})

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
