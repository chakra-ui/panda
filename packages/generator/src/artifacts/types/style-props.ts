import type { Context } from '@pandacss/core'
import { allCssProperties } from '@pandacss/is-valid-prop'
import { unionType } from '@pandacss/shared'
import outdent from 'outdent'

import type { UserConfig } from '@pandacss/types'
import csstype from '../generated/csstype.d.ts.json' assert { type: 'json' }

export function generateStyleProps(ctx: Context) {
  const props = new Set(allCssProperties.concat(ctx.utility.keys()).filter(Boolean))
  const propTypes = ctx.utility.getTypes()

  const cssVars = unionType(ctx.globalVars.vars)

  return outdent`
    ${ctx.file.importType('ConditionalValue', './conditions')}
    ${ctx.file.importType('OnlyKnown, UtilityValues, WithEscapeHatch', './prop-type')}
    ${ctx.file.importType('CssProperties', './system-types')}
    ${ctx.file.importType('Token', '../tokens/index')}

    type AnyString = (string & {})
    type CssVars = ${[cssVars || '`var(--${string})`'].filter(Boolean).join(' | ')}
    type CssVarValue = ConditionalValue<Token${ctx.globalVars.isEmpty() ? '' : ' | CssVars'} | AnyString | (number & {})>

    type CssVarKeys = ${[...ctx.globalVars.names.map((name) => `"--${name}"`), '`--${string}` & {}'].filter(Boolean).join(' | ')}

    export type CssVarProperties = {
      [key in CssVarKeys]?: CssVarValue
    }

    export interface SystemProperties {
      ${Array.from(props)
        .map((key) => {
          // mt -> marginTop
          const prop = ctx.utility.shorthands.get(key) ?? key

          const union = []
          // `scaleX` isn't a valid css property, will fallback to `string | number`
          const cssFallback = allCssProperties.includes(prop) ? `CssProperties["${prop}"]` : ''

          // has values (utility or tokens)
          if (propTypes.has(prop)) {
            const utilityValue = `UtilityValues["${prop}"]`
            if (strictPropertyList.has(key)) {
              union.push([utilityValue, 'CssVars'].join(' | '))
            } else {
              union.push(
                [utilityValue, 'CssVars', ctx.config.strictTokens ? '' : cssFallback].filter(Boolean).join(' | '),
              )
            }
          } else {
            union.push([strictPropertyList.has(key) ? 'CssVars' : '', cssFallback].filter(Boolean).join(' | '))
          }

          const filtered = union.filter(Boolean)
          // most likely a custom utility that maps to a CSS variable
          if (!filtered.length) {
            filtered.push('string | number')
          }

          let comment = (csstype.comments as Record<string, string>)?.[prop] || ''
          if (ctx.utility.isDeprecated(prop)) {
            comment = comment ? comment.replace('@see', '@deprecated\n@see') : '/** @deprecated */'
          }

          const value = filtered.filter(Boolean).join(' | ')
          const line = `${key}?: ${restrict(prop, value, ctx.config)}`

          return ' ' + [comment, line].filter(Boolean).join('\n')
        })
        .join('\n')}
    }
    `
}

const strictPropertyList = new Set([
  'alignContent',
  'alignItems',
  'alignSelf',
  'all',
  'animationComposition',
  'animationDirection',
  'animationFillMode',
  'appearance',
  'backfaceVisibility',
  'backgroundAttachment',
  'backgroundClip',
  'borderCollapse',
  'borderBlockEndStyle',
  'borderBlockStartStyle',
  'borderBlockStyle',
  'borderBottomStyle',
  'borderInlineEndStyle',
  'borderInlineStartStyle',
  'borderInlineStyle',
  'borderLeftStyle',
  'borderRightStyle',
  'borderTopStyle',
  'boxDecorationBreak',
  'boxSizing',
  'breakAfter',
  'breakBefore',
  'breakInside',
  'captionSide',
  'clear',
  'columnFill',
  'columnRuleStyle',
  'contentVisibility',
  'direction',
  'display',
  'emptyCells',
  'flexDirection',
  'flexWrap',
  'float',
  'fontKerning',
  'forcedColorAdjust',
  'isolation',
  'lineBreak',
  'mixBlendMode',
  'objectFit',
  'outlineStyle',
  'overflow',
  'overflowX',
  'overflowY',
  'overflowBlock',
  'overflowInline',
  'overflowWrap',
  'pointerEvents',
  'position',
  'resize',
  'scrollBehavior',
  'touchAction',
  'transformBox',
  'transformStyle',
  'userSelect',
  'visibility',
  'wordBreak',
  'writingMode',
])

const restrict = (key: string, value: string, config: UserConfig) => {
  if (config.strictPropertyValues && strictPropertyList.has(key)) {
    return `ConditionalValue<WithEscapeHatch<OnlyKnown<"${key}", ${value}>>>`
  }

  if (config.strictTokens) return `ConditionalValue<WithEscapeHatch<${value}>>`
  return `ConditionalValue<${value} | AnyString>`
}
