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
  size: createTransition('width, height, min-width, max-width, min-height, max-height'),
  position: createTransition('left, right, top, bottom, inset, inset-inline, inset-block'),
  background: createTransition('background, background-color, background-image, background-position'),
  colors: createTransition('color, background-color, border-color, outline-color, text-decoration-color, fill, stroke'),
  opacity: createTransition('opacity'),
  shadow: createTransition('box-shadow'),
  transform: createTransition('transform'),
}

const transitionPropertyMap: Record<string, string> = {
  common:
    'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
  colors: 'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
  size: 'width, height, min-width, max-width, min-height, max-height',
  position: 'left, right, top, bottom, inset, inset-inline, inset-block',
  background: 'background, background-color, background-image, background-position',
}

export const transitions: UtilityConfig = {
  transitionTimingFunction: {
    className: 'trs-tmf',
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
    className: 'trs-dly',
    values: 'durations',
    group: 'Transition',
  },
  transitionDuration: {
    className: 'trs-dur',
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
    className: 'trs-prop',
    group: 'Transition',
    values: transitionPropertyMap,
    transform(value) {
      return {
        '--transition-prop': value,
        transitionProperty: value,
      }
    },
  },
  transition: {
    className: 'trs',
    values: Object.keys(transitionMap),
    group: 'Transition',
    transform(value: string) {
      return transitionMap[value] ?? { transition: value }
    },
  },

  // Animations

  animation: {
    className: 'anim',
    values: 'animations',
    group: 'Animation',
  },
  animationName: {
    className: 'anim-n',
    values: 'keyframes',
    group: 'Animation',
  },
  animationTimingFunction: {
    className: 'anim-tmf',
    values: 'easings',
    group: 'Animation',
  },
  animationDuration: {
    className: 'anim-dur',
    values: 'durations',
    group: 'Animation',
  },
  animationDelay: {
    className: 'anim-dly',
    values: 'durations',
    group: 'Animation',
  },
  animationPlayState: {
    className: 'anim-ps',
    group: 'Animation',
  },
  animationComposition: {
    className: 'anim-comp',
    group: 'Animation',
  },
  animationFillMode: {
    className: 'anim-fm',
    group: 'Animation',
  },
  animationDirection: {
    className: 'anim-dir',
    group: 'Animation',
  },
  animationIterationCount: {
    className: 'anim-ic',
    group: 'Animation',
  },
  animationRange: {
    className: 'anim-r',
    group: 'Animation',
  },
  animationState: {
    className: 'anim-s',
    group: 'Animation',
  },
  animationRangeStart: {
    className: 'anim-rs',
    group: 'Animation',
  },
  animationRangeEnd: {
    className: 'anim-re',
    group: 'Animation',
  },
  animationTimeline: {
    className: 'anim-tl',
    group: 'Animation',
  },
}
