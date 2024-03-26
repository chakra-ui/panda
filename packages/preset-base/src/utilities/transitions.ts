import type { UtilityConfig } from '@pandacss/types'

const createTransition = (value: string) => ({
  transitionProperty: `var(--transition-prop, ${value})`,
  transitionTimingFunction: 'var(--transition-easing, cubic-bezier(0.4, 0, 0.2, 1))',
  transitionDuration: 'var(--transition-duration, 150ms)',
})

const transitionMap: Record<string, any> = {
  all: createTransition('all'),
  common: createTransition(
    'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
  ),
  background: createTransition('background, background-color'),
  colors: createTransition('color, background-color, border-color, outline-color, text-decoration-color, fill, stroke'),
  opacity: createTransition('opacity'),
  shadow: createTransition('box-shadow'),
  transform: createTransition('transform'),
}

export const transitions: UtilityConfig = {
  transitionTimingFunction: {
    className: 'ease',
    values: 'easings',
    group: 'Transition',
    transform(value: string) {
      return {
        '--transition-easing': value,
        transitionTimingFunction: value,
      }
    },
  },
  transitionDelay: {
    className: 'delay',
    values: 'durations',
    group: 'Transition',
  },
  transitionDuration: {
    className: 'duration',
    values: 'durations',
    group: 'Transition',
    transform(value: string) {
      return {
        '--transition-duration': value,
        transitionDuration: value,
      }
    },
  },
  transitionProperty: {
    className: 'transition-prop',
    group: 'Transition',
    transform(value) {
      return {
        '--transition-prop': value,
        transitionProperty: value,
      }
    },
  },
  transition: {
    className: 'transition',
    values: Object.keys(transitionMap),
    group: 'Transition',
    transform(value: string) {
      return transitionMap[value] ?? { transition: value }
    },
  },
  animation: {
    className: 'animation',
    values: 'animations',
    group: 'Transition',
  },
  animationName: {
    className: 'animation-name',
    values: 'animationName',
    group: 'Transition',
  },
  animationTimingFunction: {
    className: 'animation-ease',
    values: 'easings',
    group: 'Transition',
  },
  animationDuration: {
    className: 'animation-duration',
    values: 'durations',
    group: 'Transition',
  },
  animationDelay: {
    className: 'animation-delay',
    values: 'durations',
    group: 'Transition',
  },
}
