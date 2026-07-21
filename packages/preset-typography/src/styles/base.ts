import type { ProseStyleParts } from './types'

function color(prefix: string, role: string) {
  return `{colors.${prefix}.${role}}`
}

/** Shared prose styles (colors + structure). Size variants layer type scale on top. */
export function createBaseStyles(prefix: string): ProseStyleParts {
  return {
    root: {
      color: color(prefix, 'body'),
      maxWidth: '{sizes.prose}',
      fontFamily: '{fonts.sans}',
    },
    elements: {
      a: {
        color: color(prefix, 'link'),
        textDecoration: 'underline',
        textDecorationColor: color(prefix, 'linkDecoration'),
        textDecorationThickness: '1px',
        fontWeight: '{fontWeights.medium}',
        textUnderlineOffset: '0.2em',
      },
      'strong, b': {
        color: color(prefix, 'bold'),
        fontWeight: '{fontWeights.semibold}',
      },
      'ol, ul': {
        paddingInlineStart: '{spacing.6}',
      },
      ol: {
        listStyleType: 'decimal',
      },
      ul: {
        listStyleType: 'disc',
      },
      'ol > li::marker': {
        color: color(prefix, 'counter'),
        fontWeight: '{fontWeights.normal}',
      },
      'ul > li::marker': {
        color: color(prefix, 'bullet'),
      },
      hr: {
        borderColor: color(prefix, 'hrBorder'),
        borderTopWidth: '1px',
      },
      blockquote: {
        fontWeight: '{fontWeights.medium}',
        fontStyle: 'normal',
        color: color(prefix, 'quote'),
        borderInlineStartWidth: '2px',
        borderInlineStartColor: color(prefix, 'quoteBorder'),
      },
      'h1, h2, h3, h4': {
        color: color(prefix, 'heading'),
        fontWeight: '{fontWeights.semibold}',
        letterSpacing: '{letterSpacings.tight}',
      },
      'h1 strong, h2 strong, h3 strong, h4 strong': {
        fontWeight: '{fontWeights.bold}',
        color: 'inherit',
      },
      code: {
        color: color(prefix, 'code'),
        fontWeight: '{fontWeights.semibold}',
        fontFamily: '{fonts.mono}',
        fontSize: '0.875em',
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
        fontWeight: '{fontWeights.normal}',
        fontFamily: '{fonts.mono}',
        borderRadius: '{radii.md}',
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
        fontFamily: '{fonts.mono}',
        fontWeight: '{fontWeights.medium}',
        borderWidth: '1px',
        borderColor: color(prefix, 'hrBorder'),
        borderRadius: '{radii.sm}',
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
        fontWeight: '{fontWeights.semibold}',
        verticalAlign: 'bottom',
      },
      'tbody tr': {
        borderBottomWidth: '1px',
        borderBottomColor: color(prefix, 'tdBorder'),
      },
      'tbody tr:last-child': {
        borderBottomWidth: '0',
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
        fontWeight: '{fontWeights.normal}',
      },
      ' > :first-child': {
        marginBlockStart: '0',
      },
      ' > :last-child': {
        marginBlockEnd: '0',
      },
    },
  }
}
