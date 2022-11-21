import type { Keyframes } from '@pandacss/types'

export const keyframes: Keyframes = {
  spin: {
    value: {
      to: {
        transform: 'rotate(360deg)',
      },
    },
  },
  ping: {
    value: {
      '75%, 100%': {
        transform: 'scale(2)',
        opacity: '0',
      },
    },
  },
  pulse: {
    value: {
      '50%': {
        opacity: '.5',
      },
    },
  },
  bounce: {
    value: {
      '0%, 100%': {
        transform: 'translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
      },
      '50%': {
        transform: 'none',
        animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
      },
    },
  },
}
