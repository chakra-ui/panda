import type { Theme, Tokens } from '@pandacss/types'

export const keyframes: Theme['keyframes'] = {
  'fade-in': {
    to: {
      opacity: 1,
    },
  },
  'fade-out': {
    to: {
      opacity: 0,
    },
  },
  'zoom-in': {
    '0%': {
      opacity: 0,
      transform: 'scale(0.5)',
    },
    '50%': {
      opacity: 1,
    },
    '75%': {
      transform: 'scale(1.25)',
    },
    '100%': {
      transform: 'scale(1)',
    },
  },
  'shrink-out': {
    to: {
      opacity: 0,
      transform: 'scale(0.75)',
    },
  },
}

export const easings: Tokens['easings'] = {
  'ease-in-out': {
    value: 'cubic-bezier(0.15,1,0.3,1)',
  },
  'ease-in': {
    value: 'cubic-bezier(0.8,0,0,0.8)',
  },
  'ease-out': {
    value: 'cubic-bezier(0.2,0,0,1)',
  },
}

export const durations: Tokens['durations'] = {
  smallMs: { value: '100ms' },
  mediumMs: { value: '350ms' },
  largeMs: { value: '700ms' },
}

export const animations: Tokens['animations'] = {
  'fade-in': {
    value: 'fade-in 0.125s ease-in-out',
  },
  'fade-out': {
    value: 'fade-out 0.125s ease-in-out',
  },
  'zoom-in': {
    value: 'zoom-in 0.125s ease-in-out',
  },
  'shrink-out': {
    value: 'shrink-out 0.125s ease-in-out',
  },
}
