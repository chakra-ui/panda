import { css } from 'styled-system/css'

export const root = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  h: '6',
  fontSize: '12px',
  fontWeight: '500',
  color: 'muted',
  '& i': { w: '1.5', h: '1.5', rounded: 'full', bg: 'faint' },
  '&[data-live]': {
    color: 'ink',
    '& i': {
      '--ring': 'color-mix(in srgb, token(colors.success) 22%, transparent)',
      bg: 'success',
      boxShadow: '0 0 0 2px var(--ring)',
      animation: 'livePulse 2s ease-in-out infinite',
      _motionReduce: { animation: 'none' },
    },
  },
})
