import type { UtilityConfig } from '@pandacss/types'

export const interactivity: UtilityConfig = {
  accentColor: {
    className: 'accent',
    values: 'colors',
  },
  caretColor: {
    className: 'caret',
    values: 'colors',
  },
  scrollBehavior: {
    className: 'scroll',
  },
  scrollMargin: {
    className: 'scroll-m',
    values: 'spacing',
  },
  scrollMarginX: {
    className: 'scroll-mx',
    values: 'spacing',
    property: 'scrollMarginInline',
    transform(value) {
      return {
        scrollMarginInline: value,
      }
    },
  },
  scrollMarginY: {
    className: 'scroll-my',
    values: 'spacing',
    property: 'scrollMarginBlock',
    transform(value) {
      return {
        scrollMarginBlock: value,
      }
    },
  },
  scrollMarginLeft: {
    className: 'scroll-ml',
    values: 'spacing',
  },
  scrollMarginRight: {
    className: 'scroll-mr',
    values: 'spacing',
  },
  scrollMarginTop: {
    className: 'scroll-mt',
    values: 'spacing',
  },
  scrollMarginBottom: {
    className: 'scroll-mb',
    values: 'spacing',
  },
  scrollMarginBlock: {
    className: 'scroll-my',
    values: 'spacing',
  },
  scrollMarginBlockEnd: {
    className: 'scroll-mb',
    values: 'spacing',
  },
  scrollMarginBlockStart: {
    className: 'scroll-mt',
    values: 'spacing',
  },
  scrollMarginInline: {
    className: 'scroll-mx',
    values: 'spacing',
  },
  scrollMarginInlineEnd: {
    className: 'scroll-mr',
    values: 'spacing',
  },
  scrollMarginInlineStart: {
    className: 'scroll-ml',
    values: 'spacing',
  },
  scrollPadding: {
    className: 'scroll-p',
    values: 'spacing',
  },
  scrollPaddingBlock: {
    className: 'scroll-pb',
    values: 'spacing',
  },
  scrollPaddingBlockStart: {
    className: 'scroll-pt',
    values: 'spacing',
  },
  scrollPaddingBlockEnd: {
    className: 'scroll-pb',
    values: 'spacing',
  },
  scrollPaddingInline: {
    className: 'scroll-px',
    values: 'spacing',
  },
  scrollPaddingInlineEnd: {
    className: 'scroll-pr',
    values: 'spacing',
  },
  scrollPaddingInlineStart: {
    className: 'scroll-pl',
    values: 'spacing',
  },
  scrollPaddingX: {
    className: 'scroll-px',
    values: 'spacing',
    property: 'scrollPaddingInline',
    transform(value) {
      return {
        scrollPaddingInline: value,
      }
    },
  },
  scrollPaddingY: {
    className: 'scroll-py',
    values: 'spacing',
    property: 'scrollPaddingBlock',
    transform(value) {
      return {
        scrollPaddingBlock: value,
      }
    },
  },
  scrollPaddingLeft: {
    className: 'scroll-pl',
    values: 'spacing',
  },
  scrollPaddingRight: {
    className: 'scroll-pr',
    values: 'spacing',
  },
  scrollPaddingTop: {
    className: 'scroll-pt',
    values: 'spacing',
  },
  scrollPaddingBottom: {
    className: 'scroll-pb',
    values: 'spacing',
  },
  scrollSnapAlign: {
    className: 'snap',
  },
  scrollSnapStop: {
    className: 'snap',
  },
  scrollSnapType: {
    className: 'snap',
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
    transform(value) {
      return {
        '--scroll-snap-strictness': value,
      }
    },
  },
  scrollSnapMargin: {
    className: 'snap-m',
    values: 'spacing',
  },
  scrollSnapMarginTop: {
    className: 'snap-mt',
    values: 'spacing',
  },
  scrollSnapMarginBottom: {
    className: 'snap-mb',
    values: 'spacing',
  },
  scrollSnapMarginLeft: {
    className: 'snap-ml',
    values: 'spacing',
  },
  scrollSnapMarginRight: {
    className: 'snap-mr',
    values: 'spacing',
  },
  touchAction: {
    className: 'touch',
  },
  userSelect: {
    className: 'select',
  },
}
