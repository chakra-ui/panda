import type { Context } from '@pandacss/core'
import { allCssProperties } from '@pandacss/is-valid-prop'
import { unionType } from '@pandacss/shared'
import outdent from 'outdent'
import { match } from 'ts-pattern'

import type { UserConfig } from '@pandacss/types'
import csstype from '../generated/csstype.d.ts.json' assert { type: 'json' }

export function generateStyleProps(ctx: Context) {
  const props = new Set(allCssProperties.concat(ctx.utility.keys()).filter(Boolean))
  const propTypes = ctx.utility.getTypes()

  const cssVars = ctx.globalVars
  const withCssVars = cssVars.isEmpty() ? '' : 'CssVars'

  return outdent`
    ${ctx.file.importType('ConditionalValue', './conditions')}
    ${ctx.file.importType('OnlyKnown, UtilityValues, WithEscapeHatch', './prop-type')}
    ${ctx.file.importType('CssProperties', './system-types')}
    ${ctx.file.importType('Token', '../tokens/index')}

    type AnyString = (string & {})
    type CssVarValue = ConditionalValue<Token | AnyString | (number & {})>

    type GenericCssVarProperties = {
      [key in \`--$\{string & {}}\`]?: CssVarValue
    }


    ${match(ctx.globalVars.isEmpty())
      .with(
        false,
        () => outdent`
      type CssVarName = ${unionType(ctx.globalVars.names)}
      type CssVars = ${unionType(cssVars.vars)}

      type CssVar = \`--\${CssVarName}\`

      export type CssVarProperties = ConfigCssVarProperties & GenericCssVarProperties
      `,
      )
      .otherwise(() => outdent`export type CssVarProperties = GenericCssVarProperties`)}

    export interface SystemProperties {
      ${Array.from(props)
        .map((key) => {
          // mt -> marginTop
          const prop = ctx.utility.shorthands.get(key) ?? key

          const union = [withCssVars]
          // `scaleX` isn't a valid css property, will fallback to `string | number`
          const cssFallback = allCssProperties.includes(prop) ? `CssProperties["${prop}"]` : ''

          if (!propTypes.has(prop)) union.push(cssFallback)
          else {
            union.push(
              strictPropertyValue(prop, `UtilityValues["${prop}"]`, ctx.config.strictTokens ? '' : cssFallback),
            )
          }

          const filtered = union.filter(Boolean)
          // most likely a custom utility that maps to a CSS variable
          if (!filtered.length) {
            filtered.push('string | number')
          }

          const comment = (csstype.comments as Record<string, string>)?.[prop] || ''
          const line = `${key}?: ${restrict(prop, filtered.filter(Boolean).join(' | '), ctx.config)}`

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
const strictPropertyValue = (key: string, value: string, fallback: string) =>
  strictPropertyList.has(key) ? value : [value, fallback].filter(Boolean).join(' | ')

const restrict = (key: string, value: string, config: UserConfig) => {
  if (config.strictPropertyValues && strictPropertyList.has(key)) {
    return `ConditionalValue<WithEscapeHatch<OnlyKnown<"${key}", ${value}>>>`
  }

  if (config.strictTokens) return `ConditionalValue<WithEscapeHatch<${value}>>`
  return `ConditionalValue<${value} | AnyString>`
}
