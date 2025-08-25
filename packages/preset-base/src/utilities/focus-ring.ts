import type { PropertyConfig, UtilityConfig } from '@pandacss/types'

function createFocusRing(selector: any, className: string): PropertyConfig {
  return {
    className,
    group: 'Focus Ring',
    values: ['outside', 'inside', 'mixed', 'none'],
    transform(value: 'outside' | 'inside' | 'mixed' | 'none') {
      const fallback = 'var(--global-color-focus-ring, #005FCC)'
      const focusRingColor = `var(--focus-ring-color-prop, ${fallback})`
      switch (value) {
        case 'inside':
          return {
            '--focus-ring-color': focusRingColor,
            [selector]: {
              outlineOffset: '0px',
              outlineWidth: 'var(--focus-ring-width, 1px)',
              outlineColor: 'var(--focus-ring-color)',
              outlineStyle: 'var(--focus-ring-style, solid)',
              borderColor: 'var(--focus-ring-color)',
            },
          }
        case 'outside':
          return {
            '--focus-ring-color': focusRingColor,
            [selector]: {
              outlineWidth: 'var(--focus-ring-width, 2px)',
              outlineOffset: 'var(--focus-ring-offset, 2px)',
              outlineStyle: 'var(--focus-ring-style, solid)',
              outlineColor: 'var(--focus-ring-color)',
            },
          }

        case 'mixed':
          return {
            '--focus-ring-color': focusRingColor,
            [selector]: {
              outlineOffset: '0px',
              outlineWidth: 'var(--focus-ring-width, 3px)',
              outlineStyle: 'var(--focus-ring-style, solid)',
              outlineColor: 'color-mix(in srgb, var(--focus-ring-color), transparent 60%)',
              borderColor: 'var(--focus-ring-color)',
            },
          }

        case 'none':
          return {
            '--focus-ring-color': focusRingColor,
            [selector]: {
              outline: 'none',
            },
          }

        default:
          return {}
      }
    },
  }
}

export const focusRing: UtilityConfig = {
  focusRing: createFocusRing('&:is(:focus, [data-focus])', 'focus-ring'),
  focusVisibleRing: createFocusRing('&:is(:focus-visible, [data-focus-visible])', 'focus-v-ring'),
  focusRingColor: {
    className: 'focus-ring-c',
    values: 'colors',
    group: 'Focus Ring',
    transform(value, { utils }) {
      const prop = '--focus-ring-color-prop'
      const mix = utils.colorMix(value)
      if (mix.invalid) return { [prop]: value }
      const cssVar = '--mix-' + prop
      return {
        [cssVar]: mix.value,
        [prop]: `var(${cssVar}, ${mix.color})`,
      }
    },
  },
  focusRingOffset: {
    className: 'focus-ring-o',
    values: 'spacing',
    group: 'Focus Ring',
    transform: (v) => ({ '--focus-ring-offset': v }),
  },
  focusRingWidth: {
    className: 'focus-ring-w',
    values: 'borderWidths',
    property: 'outlineWidth',
    group: 'Focus Ring',
    transform: (v) => ({ '--focus-ring-width': v }),
  },
  focusRingStyle: {
    className: 'focus-ring-s',
    values: 'borderStyles',
    property: 'outlineStyle',
    group: 'Focus Ring',
    transform: (v) => ({ '--focus-ring-style': v }),
  },
}
