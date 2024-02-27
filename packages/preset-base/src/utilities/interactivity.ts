import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const interactivity: UtilityConfig = {
  accentColor: {
    className: 'accent',
    values: 'colors',
    transform: createColorMixTransform('accentColor'),
    group: 'Color',
  },
  caretColor: {
    className: 'caret',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('caretColor'),
  },
  scrollBehavior: {
    className: 'scroll',
    group: 'Scroll',
  },
  scrollbar: {
    className: 'scrollbar',
    values: ['visible', 'hidden'],
    group: 'Scroll',
    transform(value) {
      if (value === 'visible') {
        return {
          msOverflowStyle: 'auto',
          scrollbarWidth: 'auto',
          '&::-webkit-scrollbar': {
            display: 'block',
          },
        }
      }
      if (value === 'hidden') {
        return {
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }
      }
    },
  },
  scrollMargin: {
    className: 'scroll-m',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginLeft: {
    className: 'scroll-ml',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginRight: {
    className: 'scroll-mr',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginTop: {
    className: 'scroll-mt',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginBottom: {
    className: 'scroll-mb',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginBlock: {
    className: 'scroll-my',
    values: 'spacing',
    group: 'Scroll',
    shorthand: ['scrollMarginY'],
  },
  scrollMarginBlockEnd: {
    className: 'scroll-mb',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginBlockStart: {
    className: 'scroll-mt',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginInline: {
    className: 'scroll-mx',
    values: 'spacing',
    group: 'Scroll',
    shorthand: ['scrollMarginX'],
  },
  scrollMarginInlineEnd: {
    className: 'scroll-me',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginInlineStart: {
    className: 'scroll-ms',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPadding: {
    className: 'scroll-p',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingBlock: {
    className: 'scroll-pb',
    values: 'spacing',
    group: 'Scroll',
    shorthand: ['scrollPaddingY'],
  },
  scrollPaddingBlockStart: {
    className: 'scroll-pt',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingBlockEnd: {
    className: 'scroll-pb',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingInline: {
    className: 'scroll-px',
    values: 'spacing',
    group: 'Scroll',
    shorthand: ['scrollPaddingX'],
  },
  scrollPaddingInlineEnd: {
    className: 'scroll-pe',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingInlineStart: {
    className: 'scroll-ps',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingLeft: {
    className: 'scroll-pl',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingRight: {
    className: 'scroll-pr',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingTop: {
    className: 'scroll-pt',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingBottom: {
    className: 'scroll-pb',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollSnapAlign: {
    className: 'snap',
    group: 'Scroll',
  },
  scrollSnapStop: {
    className: 'snap',
    group: 'Scroll',
  },
  scrollSnapType: {
    className: 'snap',
    group: 'Scroll',
    values: {
      none: 'none',
      x: 'x var(--scroll-snap-strictness)',
      y: 'y var(--scroll-snap-strictness)',
      both: 'both var(--scroll-snap-strictness)',
    },
  },
  scrollSnapStrictness: {
    className: 'strictness',
    values: ['mandatory', 'proximity'],
    group: 'Scroll',
    transform(value) {
      return {
        '--scroll-snap-strictness': value,
      }
    },
  },
  scrollSnapMargin: {
    className: 'snap-m',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollSnapMarginTop: {
    className: 'snap-mt',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollSnapMarginBottom: {
    className: 'snap-mb',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollSnapMarginLeft: {
    className: 'snap-ml',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollSnapMarginRight: {
    className: 'snap-mr',
    values: 'spacing',
    group: 'Scroll',
  },
  touchAction: {
    className: 'touch',
    group: 'Interactivity',
  },
  userSelect: {
    className: 'select',
    group: 'Interactivity',
    transform(value) {
      return {
        WebkitUserSelect: value,
        userSelect: value,
      }
    },
  },
}
