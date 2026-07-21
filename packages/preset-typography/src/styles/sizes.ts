import type { ProseSize } from '../types'
import type { ProseStyleParts } from './types'

type SizeScale = {
  root: {
    fontSize: string
    lineHeight: string
  }
  p: { marginBlock: string }
  lead: { fontSize: string; lineHeight: string; marginBlock: string }
  blockquote: { marginBlock: string; paddingInlineStart: string }
  heading: {
    h1: { fontSize: string; lineHeight: string; marginBlockStart: string; marginBlockEnd: string }
    h2: { fontSize: string; lineHeight: string; marginBlockStart: string; marginBlockEnd: string }
    h3: { fontSize: string; lineHeight: string; marginBlockStart: string; marginBlockEnd: string }
    h4: { fontSize: string; lineHeight: string; marginBlockStart: string; marginBlockEnd: string }
  }
  list: { marginBlock: string }
  listItem: { marginBlock: string }
  nestedList: { marginBlock: string }
  hr: { marginBlock: string }
  pre: { marginBlock: string; padding: string; fontSize: string; lineHeight: string }
  kbd: { fontSize: string; paddingInline: string; paddingBlock: string }
  table: { marginBlock: string; fontSize: string; lineHeight: string }
  thTd: { paddingInline: string; paddingBlock: string }
  figure: { marginBlock: string }
  figcaption: { marginBlockStart: string; fontSize: string; lineHeight: string }
}

const scales: Record<ProseSize, SizeScale> = {
  sm: {
    root: { fontSize: '{fontSizes.sm}', lineHeight: '{lineHeights.relaxed}' },
    p: { marginBlock: '{spacing.4}' },
    lead: {
      fontSize: '{fontSizes.md}',
      lineHeight: '{lineHeights.relaxed}',
      marginBlock: '{spacing.4}',
    },
    blockquote: {
      marginBlock: '{spacing.5}',
      paddingInlineStart: '{spacing.4}',
    },
    heading: {
      h1: {
        fontSize: '{fontSizes.2xl}',
        lineHeight: '{lineHeights.tight}',
        marginBlockStart: '0',
        marginBlockEnd: '{spacing.4}',
      },
      h2: {
        fontSize: '{fontSizes.xl}',
        lineHeight: '{lineHeights.snug}',
        marginBlockStart: '{spacing.8}',
        marginBlockEnd: '{spacing.3}',
      },
      h3: {
        fontSize: '{fontSizes.lg}',
        lineHeight: '{lineHeights.snug}',
        marginBlockStart: '{spacing.6}',
        marginBlockEnd: '{spacing.2}',
      },
      h4: {
        fontSize: '{fontSizes.md}',
        lineHeight: '{lineHeights.snug}',
        marginBlockStart: '{spacing.5}',
        marginBlockEnd: '{spacing.2}',
      },
    },
    list: { marginBlock: '{spacing.4}' },
    listItem: { marginBlock: '{spacing.1}' },
    nestedList: { marginBlock: '{spacing.2}' },
    hr: { marginBlock: '{spacing.8}' },
    pre: {
      marginBlock: '{spacing.5}',
      padding: '{spacing.3}',
      fontSize: '{fontSizes.xs}',
      lineHeight: '{lineHeights.relaxed}',
    },
    kbd: { fontSize: '{fontSizes.xs}', paddingInline: '{spacing.1}', paddingBlock: '0.125rem' },
    table: {
      marginBlock: '{spacing.5}',
      fontSize: '{fontSizes.xs}',
      lineHeight: '{lineHeights.normal}',
    },
    thTd: { paddingInline: '{spacing.2}', paddingBlock: '{spacing.1}' },
    figure: { marginBlock: '{spacing.5}' },
    figcaption: {
      marginBlockStart: '{spacing.2}',
      fontSize: '{fontSizes.xs}',
      lineHeight: '{lineHeights.normal}',
    },
  },
  md: {
    root: { fontSize: '{fontSizes.md}', lineHeight: '{lineHeights.relaxed}' },
    p: { marginBlock: '{spacing.5}' },
    lead: {
      fontSize: '{fontSizes.lg}',
      lineHeight: '{lineHeights.relaxed}',
      marginBlock: '{spacing.5}',
    },
    blockquote: {
      marginBlock: '{spacing.6}',
      paddingInlineStart: '{spacing.5}',
    },
    heading: {
      h1: {
        fontSize: '{fontSizes.4xl}',
        lineHeight: '{lineHeights.tight}',
        marginBlockStart: '0',
        marginBlockEnd: '{spacing.6}',
      },
      h2: {
        fontSize: '{fontSizes.2xl}',
        lineHeight: '{lineHeights.snug}',
        marginBlockStart: '{spacing.12}',
        marginBlockEnd: '{spacing.4}',
      },
      h3: {
        fontSize: '{fontSizes.xl}',
        lineHeight: '{lineHeights.snug}',
        marginBlockStart: '{spacing.8}',
        marginBlockEnd: '{spacing.3}',
      },
      h4: {
        fontSize: '{fontSizes.lg}',
        lineHeight: '{lineHeights.snug}',
        marginBlockStart: '{spacing.6}',
        marginBlockEnd: '{spacing.2}',
      },
    },
    list: { marginBlock: '{spacing.5}' },
    listItem: { marginBlock: '{spacing.2}' },
    nestedList: { marginBlock: '{spacing.2}' },
    hr: { marginBlock: '{spacing.10}' },
    pre: {
      marginBlock: '{spacing.6}',
      padding: '{spacing.4}',
      fontSize: '{fontSizes.sm}',
      lineHeight: '{lineHeights.relaxed}',
    },
    kbd: { fontSize: '{fontSizes.sm}', paddingInline: '{spacing.1}', paddingBlock: '0.2rem' },
    table: {
      marginBlock: '{spacing.6}',
      fontSize: '{fontSizes.sm}',
      lineHeight: '{lineHeights.normal}',
    },
    thTd: { paddingInline: '{spacing.2}', paddingBlock: '{spacing.2}' },
    figure: { marginBlock: '{spacing.6}' },
    figcaption: {
      marginBlockStart: '{spacing.3}',
      fontSize: '{fontSizes.sm}',
      lineHeight: '{lineHeights.normal}',
    },
  },
  lg: {
    root: { fontSize: '{fontSizes.lg}', lineHeight: '{lineHeights.relaxed}' },
    p: { marginBlock: '{spacing.5}' },
    lead: {
      fontSize: '{fontSizes.xl}',
      lineHeight: '{lineHeights.relaxed}',
      marginBlock: '{spacing.5}',
    },
    blockquote: {
      marginBlock: '{spacing.8}',
      paddingInlineStart: '{spacing.6}',
    },
    heading: {
      h1: {
        fontSize: '{fontSizes.5xl}',
        lineHeight: '{lineHeights.none}',
        marginBlockStart: '0',
        marginBlockEnd: '{spacing.8}',
      },
      h2: {
        fontSize: '{fontSizes.3xl}',
        lineHeight: '{lineHeights.tight}',
        marginBlockStart: '{spacing.14}',
        marginBlockEnd: '{spacing.5}',
      },
      h3: {
        fontSize: '{fontSizes.2xl}',
        lineHeight: '{lineHeights.snug}',
        marginBlockStart: '{spacing.10}',
        marginBlockEnd: '{spacing.4}',
      },
      h4: {
        fontSize: '{fontSizes.xl}',
        lineHeight: '{lineHeights.snug}',
        marginBlockStart: '{spacing.8}',
        marginBlockEnd: '{spacing.3}',
      },
    },
    list: { marginBlock: '{spacing.5}' },
    listItem: { marginBlock: '{spacing.2}' },
    nestedList: { marginBlock: '{spacing.3}' },
    hr: { marginBlock: '{spacing.12}' },
    pre: {
      marginBlock: '{spacing.7}',
      padding: '{spacing.5}',
      fontSize: '{fontSizes.md}',
      lineHeight: '{lineHeights.relaxed}',
    },
    kbd: { fontSize: '{fontSizes.md}', paddingInline: '{spacing.2}', paddingBlock: '0.25rem' },
    table: {
      marginBlock: '{spacing.7}',
      fontSize: '{fontSizes.md}',
      lineHeight: '{lineHeights.normal}',
    },
    thTd: { paddingInline: '{spacing.3}', paddingBlock: '{spacing.2}' },
    figure: { marginBlock: '{spacing.8}' },
    figcaption: {
      marginBlockStart: '{spacing.3}',
      fontSize: '{fontSizes.md}',
      lineHeight: '{lineHeights.normal}',
    },
  },
  xl: {
    root: { fontSize: '{fontSizes.xl}', lineHeight: '{lineHeights.relaxed}' },
    p: { marginBlock: '{spacing.6}' },
    lead: {
      fontSize: '{fontSizes.2xl}',
      lineHeight: '{lineHeights.relaxed}',
      marginBlock: '{spacing.6}',
    },
    blockquote: {
      marginBlock: '{spacing.8}',
      paddingInlineStart: '{spacing.6}',
    },
    heading: {
      h1: {
        fontSize: '{fontSizes.6xl}',
        lineHeight: '{lineHeights.none}',
        marginBlockStart: '0',
        marginBlockEnd: '{spacing.8}',
      },
      h2: {
        fontSize: '{fontSizes.4xl}',
        lineHeight: '{lineHeights.tight}',
        marginBlockStart: '{spacing.16}',
        marginBlockEnd: '{spacing.6}',
      },
      h3: {
        fontSize: '{fontSizes.3xl}',
        lineHeight: '{lineHeights.snug}',
        marginBlockStart: '{spacing.12}',
        marginBlockEnd: '{spacing.4}',
      },
      h4: {
        fontSize: '{fontSizes.2xl}',
        lineHeight: '{lineHeights.snug}',
        marginBlockStart: '{spacing.8}',
        marginBlockEnd: '{spacing.3}',
      },
    },
    list: { marginBlock: '{spacing.6}' },
    listItem: { marginBlock: '{spacing.2}' },
    nestedList: { marginBlock: '{spacing.3}' },
    hr: { marginBlock: '{spacing.14}' },
    pre: {
      marginBlock: '{spacing.8}',
      padding: '{spacing.6}',
      fontSize: '{fontSizes.md}',
      lineHeight: '{lineHeights.relaxed}',
    },
    kbd: { fontSize: '{fontSizes.md}', paddingInline: '{spacing.2}', paddingBlock: '0.3rem' },
    table: {
      marginBlock: '{spacing.8}',
      fontSize: '{fontSizes.md}',
      lineHeight: '{lineHeights.normal}',
    },
    thTd: { paddingInline: '{spacing.3}', paddingBlock: '{spacing.2}' },
    figure: { marginBlock: '{spacing.8}' },
    figcaption: {
      marginBlockStart: '{spacing.4}',
      fontSize: '{fontSizes.md}',
      lineHeight: '{lineHeights.normal}',
    },
  },
  '2xl': {
    root: { fontSize: '{fontSizes.2xl}', lineHeight: '{lineHeights.relaxed}' },
    p: { marginBlock: '{spacing.7}' },
    lead: {
      fontSize: '{fontSizes.3xl}',
      lineHeight: '{lineHeights.snug}',
      marginBlock: '{spacing.7}',
    },
    blockquote: {
      marginBlock: '{spacing.10}',
      paddingInlineStart: '{spacing.8}',
    },
    heading: {
      h1: {
        fontSize: '{fontSizes.7xl}',
        lineHeight: '{lineHeights.none}',
        marginBlockStart: '0',
        marginBlockEnd: '{spacing.10}',
      },
      h2: {
        fontSize: '{fontSizes.5xl}',
        lineHeight: '{lineHeights.none}',
        marginBlockStart: '{spacing.20}',
        marginBlockEnd: '{spacing.8}',
      },
      h3: {
        fontSize: '{fontSizes.4xl}',
        lineHeight: '{lineHeights.tight}',
        marginBlockStart: '{spacing.14}',
        marginBlockEnd: '{spacing.6}',
      },
      h4: {
        fontSize: '{fontSizes.3xl}',
        lineHeight: '{lineHeights.snug}',
        marginBlockStart: '{spacing.10}',
        marginBlockEnd: '{spacing.4}',
      },
    },
    list: { marginBlock: '{spacing.7}' },
    listItem: { marginBlock: '{spacing.3}' },
    nestedList: { marginBlock: '{spacing.4}' },
    hr: { marginBlock: '{spacing.16}' },
    pre: {
      marginBlock: '{spacing.10}',
      padding: '{spacing.6}',
      fontSize: '{fontSizes.lg}',
      lineHeight: '{lineHeights.relaxed}',
    },
    kbd: { fontSize: '{fontSizes.lg}', paddingInline: '{spacing.2}', paddingBlock: '0.35rem' },
    table: {
      marginBlock: '{spacing.10}',
      fontSize: '{fontSizes.lg}',
      lineHeight: '{lineHeights.normal}',
    },
    thTd: { paddingInline: '{spacing.4}', paddingBlock: '{spacing.3}' },
    figure: { marginBlock: '{spacing.10}' },
    figcaption: {
      marginBlockStart: '{spacing.4}',
      fontSize: '{fontSizes.lg}',
      lineHeight: '{lineHeights.normal}',
    },
  },
}

export function createSizeStyles(size: ProseSize): ProseStyleParts {
  const scale = scales[size]

  return {
    root: {
      fontSize: scale.root.fontSize,
      lineHeight: scale.root.lineHeight,
    },
    elements: {
      p: scale.p,
      '.lead': scale.lead,
      blockquote: scale.blockquote,
      h1: scale.heading.h1,
      h2: scale.heading.h2,
      h3: scale.heading.h3,
      h4: scale.heading.h4,
      'ol, ul': scale.list,
      li: scale.listItem,
      'ol ol, ul ul, ol ul, ul ol': scale.nestedList,
      hr: scale.hr,
      pre: scale.pre,
      kbd: scale.kbd,
      table: scale.table,
      'thead th, tbody td, tfoot td': scale.thTd,
      'figure, img, video': scale.figure,
      figcaption: scale.figcaption,
    },
  }
}
