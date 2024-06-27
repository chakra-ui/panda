export const keyframes = {
  spin: {
    to: {
      transform: 'rotate(360deg)',
    },
  },
  ping: {
    '75%, 100%': {
      transform: 'scale(2)',
      opacity: '0',
    },
  },
  pulse: {
    '50%': {
      opacity: '.5',
    },
  },
  bounce: {
    '0%, 100%': {
      transform: 'translateY(-25%)',
      animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
    },
    '50%': {
      transform: 'none',
      animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
    },
  },

  // fade
  'fade-in': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  'fade-out': {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  // slide out of view
  'slide-out-left': {
    from: { translate: '-100% 0' },
    to: { translate: '0 0' },
  },
  'slide-out-right': {
    from: { translate: '100% 0' },
    to: { translate: '0 0' },
  },
  'slide-out-up': {
    from: { translate: '0 -100%' },
    to: { translate: '0 0' },
  },
  'slide-out-down': {
    from: { translate: '0 100%' },
    to: { translate: '0 0' },
  },

  // slide from
  'slide-from-top': {
    '0%': { translate: '0 0.5rem' },
    to: { translate: '0' },
  },
  'slide-from-bottom': {
    '0%': { translate: '0 -0.5rem' },
    to: { translate: '0' },
  },
  'slide-from-left': {
    '0%': { translate: '0.5rem 0' },
    to: { translate: '0' },
  },
  'slide-from-right': {
    '0%': { translate: '-0.5rem 0' },
    to: { translate: '0' },
  },

  // slide to
  'slide-to-top': {
    '0%': { translate: '0' },
    to: { translate: '0 0.5rem' },
  },
  'slide-to-bottom': {
    '0%': { translate: '0' },
    to: { translate: '0 -0.5rem' },
  },
  'slide-to-left': {
    '0%': { translate: '0' },
    to: { translate: '0.5rem 0' },
  },
  'slide-to-right': {
    '0%': { translate: '0' },
    to: { translate: '-0.5rem 0' },
  },

  // scale
  'scale-in': {
    from: { scale: '0.97' },
    to: { scale: '1' },
  },
  'scale-out': {
    from: { scale: '1' },
    to: { scale: '0.97' },
  },
}

export const animations = {
  spin: { value: 'spin 1s linear infinite' },
  ping: { value: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' },
  pulse: { value: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' },
  bounce: { value: 'bounce 1s infinite' },
}
