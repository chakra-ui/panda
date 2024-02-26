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
    group: 'Scrollbar',
  },
  scrollbar: {
    className: 'scrollbar',
    values: ['visible', 'hidden'],
    group: 'Scrollbar',
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
    group: 'Scrollbar',
  },
  scrollMarginLeft: {
    className: 'scroll-ml',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollMarginRight: {
    className: 'scroll-mr',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollMarginTop: {
    className: 'scroll-mt',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollMarginBottom: {
    className: 'scroll-mb',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollMarginBlock: {
    className: 'scroll-my',
    values: 'spacing',
    group: 'Scrollbar',
    shorthand: ['scrollMarginY'],
  },
  scrollMarginBlockEnd: {
    className: 'scroll-mb',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollMarginBlockStart: {
    className: 'scroll-mt',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollMarginInline: {
    className: 'scroll-mx',
    values: 'spacing',
    group: 'Scrollbar',
    shorthand: ['scrollMarginX'],
  },
  scrollMarginInlineEnd: {
    className: 'scroll-me',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollMarginInlineStart: {
    className: 'scroll-ms',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollPadding: {
    className: 'scroll-p',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollPaddingBlock: {
    className: 'scroll-pb',
    values: 'spacing',
    group: 'Scrollbar',
    shorthand: ['scrollPaddingY'],
  },
  scrollPaddingBlockStart: {
    className: 'scroll-pt',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollPaddingBlockEnd: {
    className: 'scroll-pb',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollPaddingInline: {
    className: 'scroll-px',
    values: 'spacing',
    group: 'Scrollbar',
    shorthand: ['scrollPaddingX'],
  },
  scrollPaddingInlineEnd: {
    className: 'scroll-pe',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollPaddingInlineStart: {
    className: 'scroll-ps',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollPaddingLeft: {
    className: 'scroll-pl',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollPaddingRight: {
    className: 'scroll-pr',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollPaddingTop: {
    className: 'scroll-pt',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollPaddingBottom: {
    className: 'scroll-pb',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollSnapAlign: {
    className: 'snap',
    group: 'Scrollbar',
  },
  scrollSnapStop: {
    className: 'snap',
    group: 'Scrollbar',
  },
  scrollSnapType: {
    className: 'snap',
    group: 'Scrollbar',
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
    group: 'Scrollbar',
    transform(value) {
      return {
        '--scroll-snap-strictness': value,
      }
    },
  },
  scrollSnapMargin: {
    className: 'snap-m',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollSnapMarginTop: {
    className: 'snap-mt',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollSnapMarginBottom: {
    className: 'snap-mb',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollSnapMarginLeft: {
    className: 'snap-ml',
    values: 'spacing',
    group: 'Scrollbar',
  },
  scrollSnapMarginRight: {
    className: 'snap-mr',
    values: 'spacing',
    group: 'Scrollbar',
  },
  touchAction: {
    className: 'touch',
    group: 'Other Style Props',
  },
  userSelect: {
    className: 'select',
    group: 'Other Style Props',
    transform(value) {
      return {
        WebkitUserSelect: value,
        userSelect: value,
      }
    },
  },
}
