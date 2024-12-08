import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const interactivity: UtilityConfig = {
  accentColor: {
    className: 'ac-c',
    values: 'colors',
    transform: createColorMixTransform('accentColor'),
    group: 'Color',
  },
  caretColor: {
    className: 'ca-c',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('caretColor'),
  },
  scrollBehavior: {
    className: 'scr-bhv',
    group: 'Scroll',
  },

  // Scroll bar
  scrollbar: {
    className: 'scr-bar',
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
  scrollbarColor: {
    className: 'scr-bar-c',
    values: 'colors',
    group: 'Scroll',
    transform: createColorMixTransform('scrollbarColor'),
  },
  scrollbarGutter: {
    className: 'scr-bar-g',
    group: 'Scroll',
  },
  scrollbarWidth: {
    className: 'scr-bar-w',
    values: 'sizes',
    group: 'Scroll',
  },

  // Scroll Margin
  scrollMargin: {
    className: 'scr-m',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginLeft: {
    className: 'scr-ml',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginRight: {
    className: 'scr-mr',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginTop: {
    className: 'scr-mt',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginBottom: {
    className: 'scr-mb',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginBlock: {
    className: 'scr-my',
    values: 'spacing',
    group: 'Scroll',
    shorthand: ['scrollMarginY'],
  },
  scrollMarginBlockEnd: {
    className: 'scr-mbe',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginBlockStart: {
    className: 'scr-mbt',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginInline: {
    className: 'scr-mx',
    values: 'spacing',
    group: 'Scroll',
    shorthand: ['scrollMarginX'],
  },
  scrollMarginInlineEnd: {
    className: 'scr-me',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollMarginInlineStart: {
    className: 'scr-ms',
    values: 'spacing',
    group: 'Scroll',
  },

  // Scroll Padding
  scrollPadding: {
    className: 'scr-p',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingBlock: {
    className: 'scr-py',
    values: 'spacing',
    group: 'Scroll',
    shorthand: ['scrollPaddingY'],
  },
  scrollPaddingBlockStart: {
    className: 'scr-pbs',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingBlockEnd: {
    className: 'scr-pbe',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingInline: {
    className: 'scr-px',
    values: 'spacing',
    group: 'Scroll',
    shorthand: ['scrollPaddingX'],
  },
  scrollPaddingInlineEnd: {
    className: 'scr-pe',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingInlineStart: {
    className: 'scr-ps',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingLeft: {
    className: 'scr-pl',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingRight: {
    className: 'scr-pr',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingTop: {
    className: 'scr-pt',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollPaddingBottom: {
    className: 'scr-pb',
    values: 'spacing',
    group: 'Scroll',
  },

  // Scroll Snap

  scrollSnapAlign: {
    className: 'scr-sa',
    group: 'Scroll',
  },
  scrollSnapStop: {
    className: 'scrs-s',
    group: 'Scroll',
  },
  scrollSnapType: {
    className: 'scrs-t',
    group: 'Scroll',
    values: {
      none: 'none',
      x: 'x var(--scroll-snap-strictness)',
      y: 'y var(--scroll-snap-strictness)',
      both: 'both var(--scroll-snap-strictness)',
    },
  },
  scrollSnapStrictness: {
    className: 'scrs-strt',
    values: ['mandatory', 'proximity'],
    group: 'Scroll',
    transform(value) {
      return {
        '--scroll-snap-strictness': value,
      }
    },
  },
  scrollSnapMargin: {
    className: 'scrs-m',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollSnapMarginTop: {
    className: 'scrs-mt',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollSnapMarginBottom: {
    className: 'scrs-mb',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollSnapMarginLeft: {
    className: 'scrs-ml',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollSnapMarginRight: {
    className: 'scrs-mr',
    values: 'spacing',
    group: 'Scroll',
  },
  scrollSnapCoordinate: {
    className: 'scrs-c',
    group: 'Scroll',
  },
  scrollSnapDestination: {
    className: 'scrs-d',
    group: 'Scroll',
  },
  scrollSnapPointsX: {
    className: 'scrs-px',
    group: 'Scroll',
  },
  scrollSnapPointsY: {
    className: 'scrs-py',
    group: 'Scroll',
  },
  scrollSnapTypeX: {
    className: 'scrs-tx',
    group: 'Scroll',
  },
  scrollSnapTypeY: {
    className: 'scrs-ty',
    group: 'Scroll',
  },

  // Scroll Timeline

  scrollTimeline: {
    className: 'scrtl',
    group: 'Scroll',
  },
  scrollTimelineAxis: {
    className: 'scrtl-a',
    group: 'Scroll',
  },
  scrollTimelineName: {
    className: 'scrtl-n',
    group: 'Scroll',
  },
  touchAction: {
    className: 'tch-a',
    group: 'Interactivity',
  },

  userSelect: {
    className: 'us',
    group: 'Interactivity',
    transform(value) {
      return {
        WebkitUserSelect: value,
        userSelect: value,
      }
    },
  },

  // Overflow
  overflow: {
    className: 'ov',
    group: 'Scroll',
  },
  overflowWrap: {
    className: 'ov-wrap',
    group: 'Scroll',
  },
  overflowX: {
    className: 'ov-x',
    group: 'Scroll',
  },
  overflowY: {
    className: 'ov-y',
    group: 'Scroll',
  },
  overflowAnchor: {
    className: 'ov-a',
    group: 'Scroll',
  },
  overflowBlock: {
    className: 'ov-b',
    group: 'Scroll',
  },
  overflowInline: {
    className: 'ov-i',
    group: 'Scroll',
  },
  overflowClipBox: {
    className: 'ovcp-bx',
    group: 'Scroll',
  },
  overflowClipMargin: {
    className: 'ovcp-m',
    group: 'Scroll',
  },

  overscrollBehavior: {
    className: 'ovs-b',
    group: 'Scroll',
  },
  overscrollBehaviorX: {
    className: 'ovs-bx',
    group: 'Scroll',
  },
  overscrollBehaviorY: {
    className: 'ovs-by',
    group: 'Scroll',
  },
  overscrollBehaviorBlock: {
    className: 'ovs-bb',
    group: 'Scroll',
  },
  overscrollBehaviorInline: {
    className: 'ovs-bi',
    group: 'Scroll',
  },
}
