import type { UtilityConfig } from '@pandacss/types'

export const transitions: UtilityConfig = {
  transitionTimingFunction: {
    className: 'ease',
    values: 'easings',
  },
  transitionDelay: {
    className: 'delay',
    values: 'durations',
  },
  transitionDuration: {
    className: 'duration',
    values: 'durations',
  },
  transitionProperty: {
    className: 'transition',
    values: {
      all: 'all',
      none: 'none',
      opacity: 'opacity',
      shadow: 'box-shadow',
      transform: 'transform',
      base: 'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
      background: 'background, background-color',
      colors: 'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    },
  },
  animation: {
    className: 'animation',
    values: 'animations',
  },
}
