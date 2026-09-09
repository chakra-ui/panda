import type { SystemStyleObject } from '@pandacss/types'
import type { ProseSize } from './types'

export interface ProseStyleParts {
  root: SystemStyleObject
  elements: Record<string, SystemStyleObject>
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export function createProseBase(prefix: string, notProseClass?: string): SystemStyleObject {
  return assembleStyles(mergeParts(createBaseStyles(prefix), createScaleStyles(prefix)), notProseClass)
}

export function createProseSize(size: ProseSize, notProseClass?: string): SystemStyleObject {
  return assembleStyles(createSizeStyles(size), notProseClass)
}

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

// A size is one font size on the root; everything else is a ratio of it.
const rootFontSizes: Record<ProseSize, string> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  '2xl': '2xl',
}

export function createSizeStyles(size: ProseSize): ProseStyleParts {
  return {
    root: { fontSize: rootFontSizes[size] },
    elements: {},
  }
}

// ---------------------------------------------------------------------------
// Rhythm and scale
// ---------------------------------------------------------------------------

// Leading is line height; flow is the gap between blocks, in body-ems. Elements measure in `em`.
export function createScaleStyles(prefix: string): ProseStyleParts {
  const leading = cssVar(prefix, 'leading')
  const flow = cssVar(prefix, 'flow')
  // `em` in the flow var resolves per element, so divide by the element's ratio to stay in body-ems.
  const flowTimes = (bodyEms: number, ratio = 1) => `calc(${flow.ref} * ${round(bodyEms / ratio)})`

  // Assigned: computed `--*` keys in a literal widen to a string index.
  const root: SystemStyleObject = { lineHeight: leading.ref }
  root[leading.name] = '1.625'
  root[flow.name] = '1.25em'

  return {
    root,
    elements: {
      p: { marginBlockStart: flow.ref },
      '.lead': {
        fontSize: '1.125em',
        marginBlockStart: flowTimes(1, 1.125),
      },
      blockquote: {
        marginBlockStart: flowTimes(1.2),
        paddingInlineStart: '1.25em',
      },
      h1: {
        fontSize: '2.25em',
        lineHeight: '1.25',
        marginBlockStart: '0',
      },
      h2: {
        fontSize: '1.5em',
        lineHeight: '1.375',
        marginBlockStart: flowTimes(2.4, 1.5),
      },
      h3: {
        fontSize: '1.25em',
        lineHeight: '1.375',
        marginBlockStart: flowTimes(1.6, 1.25),
      },
      h4: {
        fontSize: '1.125em',
        lineHeight: '1.375',
        marginBlockStart: flowTimes(1.2, 1.125),
      },
      'ol, ul': {
        marginBlockStart: flow.ref,
        paddingInlineStart: '1.5em',
      },
      li: { marginBlockStart: flowTimes(0.4) },
      'ol ol, ul ul, ol ul, ul ol': { marginBlockStart: flowTimes(0.4) },
      hr: { marginBlockStart: flowTimes(2) },
      pre: {
        marginBlockStart: flowTimes(1.2, 0.875),
        padding: '1.1428571em 1.4285714em',
        fontSize: '0.875em',
        lineHeight: leading.ref,
      },
      kbd: {
        fontSize: '0.875em',
        paddingInline: '0.2857143em',
        paddingBlock: '0.2285714em',
      },
      table: {
        marginBlockStart: flowTimes(1.2, 0.875),
        fontSize: '0.875em',
        lineHeight: '1.5',
      },
      'thead th, tbody td, tfoot td': {
        paddingInline: '0.5714286em',
        paddingBlock: '0.5714286em',
      },
      'figure, img, video': { marginBlockStart: flowTimes(1.2) },
      figcaption: {
        marginBlockStart: flowTimes(0.6, 0.875),
        fontSize: '0.875em',
        lineHeight: '1.5',
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Colors and structure
// ---------------------------------------------------------------------------

export function createBaseStyles(prefix: string): ProseStyleParts {
  return {
    root: {
      color: color(prefix, 'body'),
      maxWidth: 'prose',
    },
    elements: {
      a: {
        color: color(prefix, 'link'),
        textDecoration: 'underline',
        textDecorationColor: color(prefix, 'linkDecoration'),
        textDecorationThickness: '1px',
        fontWeight: 'medium',
        textUnderlineOffset: '0.2em',
      },
      'strong, b': {
        color: color(prefix, 'bold'),
        fontWeight: 'semibold',
      },
      'ol, ul': {
        paddingInlineStart: '6',
      },
      ol: {
        listStyleType: 'decimal',
      },
      ul: {
        listStyleType: 'disc',
      },
      'ol > li::marker': {
        color: color(prefix, 'counter'),
        fontWeight: 'normal',
      },
      'ul > li::marker': {
        color: color(prefix, 'bullet'),
      },
      hr: {
        borderColor: color(prefix, 'hrBorder'),
        borderTopWidth: '1px',
      },
      blockquote: {
        fontWeight: 'medium',
        fontStyle: 'normal',
        color: color(prefix, 'quote'),
        borderInlineStartWidth: '2px',
        borderInlineStartColor: color(prefix, 'quoteBorder'),
      },
      'h1, h2, h3, h4': {
        color: color(prefix, 'heading'),
        fontWeight: 'semibold',
        letterSpacing: 'tight',
      },
      'h1 strong, h2 strong, h3 strong, h4 strong': {
        fontWeight: 'bold',
        color: 'inherit',
      },
      code: {
        color: color(prefix, 'code'),
        backgroundColor: color(prefix, 'codeBg'),
        fontWeight: 'medium',
        fontFamily: 'mono',
        fontSize: '0.875em',
        paddingInline: '0.3em',
        paddingBlock: '0.15em',
        borderRadius: 'sm',
      },
      'a code': {
        color: 'inherit',
      },
      'h1 code, h2 code, h3 code, h4 code': {
        color: 'inherit',
      },
      pre: {
        color: color(prefix, 'preCode'),
        backgroundColor: color(prefix, 'preBg'),
        overflowX: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: `{colors.${prefix}.hrBorder} transparent`,
        fontWeight: 'normal',
        fontFamily: 'mono',
        borderRadius: 'md',
      },
      'pre code': {
        backgroundColor: 'transparent',
        borderWidth: '0',
        borderRadius: '0',
        padding: '0',
        fontWeight: 'inherit',
        color: 'inherit',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        lineHeight: 'inherit',
      },
      kbd: {
        color: color(prefix, 'kbd'),
        fontFamily: 'mono',
        fontWeight: 'medium',
        borderWidth: '1px',
        borderColor: color(prefix, 'hrBorder'),
        borderRadius: 'sm',
      },
      table: {
        width: '100%',
        tableLayout: 'auto',
        textAlign: 'start',
      },
      thead: {
        borderBottomWidth: '1px',
        borderBottomColor: color(prefix, 'thBorder'),
      },
      'thead th': {
        color: color(prefix, 'heading'),
        fontWeight: 'semibold',
        verticalAlign: 'bottom',
      },
      'tbody tr + tr': {
        borderTopWidth: '1px',
        borderTopColor: color(prefix, 'tdBorder'),
      },
      'tbody td': {
        verticalAlign: 'baseline',
      },
      tfoot: {
        borderTopWidth: '1px',
        borderTopColor: color(prefix, 'thBorder'),
      },
      img: {
        maxWidth: '100%',
        height: 'auto',
      },
      figcaption: {
        color: color(prefix, 'caption'),
      },
      '.lead': {
        color: color(prefix, 'lead'),
        fontWeight: 'normal',
      },
      ' > :first-child': {
        marginBlockStart: '0',
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function color(prefix: string, role: string) {
  return `${prefix}.${role}`
}

function cssVar(prefix: string, name: string) {
  const property = `--${prefix}-${name}` as `--${string}`
  return { name: property, ref: `var(${property})` }
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000
}

function mergeParts(first: ProseStyleParts, second: ProseStyleParts): ProseStyleParts {
  const elements: Record<string, SystemStyleObject> = { ...first.elements }
  for (const [selector, styles] of Object.entries(second.elements)) {
    elements[selector] = { ...elements[selector], ...styles } as SystemStyleObject
  }
  return { root: { ...first.root, ...second.root } as SystemStyleObject, elements }
}

function nestSelector(selector: string, notProseClass?: string): string {
  const parts = selector
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (!notProseClass) {
    return parts.map((part) => `& ${part}`).join(', ')
  }

  return parts
    .map((part) => `& :where(${part}):not(:where([class~="${notProseClass}"],[class~="${notProseClass}"] *))`)
    .join(', ')
}

export function assembleStyles(parts: ProseStyleParts, notProseClass?: string): SystemStyleObject {
  const nested: Record<string, SystemStyleObject> = {}

  for (const [selector, value] of Object.entries(parts.elements)) {
    nested[nestSelector(selector, notProseClass)] = value
  }

  return { ...parts.root, ...nested } as SystemStyleObject
}
