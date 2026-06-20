import { type Inspect, type RuleModuleLike, toEslintLoc } from './shared'

export const noPhysicalPropertiesRuleName = 'no-physical-properties'

// Physical property → suggested logical equivalent.
const PHYSICAL: Record<string, string> = {
  left: 'insetInlineStart',
  right: 'insetInlineEnd',
  top: 'insetBlockStart',
  bottom: 'insetBlockEnd',
  marginLeft: 'marginInlineStart',
  marginRight: 'marginInlineEnd',
  marginTop: 'marginBlockStart',
  marginBottom: 'marginBlockEnd',
  paddingLeft: 'paddingInlineStart',
  paddingRight: 'paddingInlineEnd',
  paddingTop: 'paddingBlockStart',
  paddingBottom: 'paddingBlockEnd',
  borderLeft: 'borderInlineStart',
  borderRight: 'borderInlineEnd',
  borderTop: 'borderBlockStart',
  borderBottom: 'borderBlockEnd',
  borderLeftWidth: 'borderInlineStartWidth',
  borderRightWidth: 'borderInlineEndWidth',
  borderTopWidth: 'borderBlockStartWidth',
  borderBottomWidth: 'borderBlockEndWidth',
  borderTopLeftRadius: 'borderStartStartRadius',
  borderTopRightRadius: 'borderStartEndRadius',
  borderBottomLeftRadius: 'borderEndStartRadius',
  borderBottomRightRadius: 'borderEndEndRadius',
}

export function createNoPhysicalPropertiesRule(options: { inspect: Inspect }): RuleModuleLike {
  return {
    meta: {
      type: 'suggestion',
      docs: { description: 'Disallow physical properties that have logical equivalents.' },
      schema: [],
      messages: { physical: '{{message}}' },
    },
    create(context) {
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return
          for (const entry of inspection.styleEntries) {
            if (entry.kind !== 'utility') continue
            const prop = entry.canonicalName ?? entry.name
            const logical = PHYSICAL[prop]
            if (logical === undefined) continue
            context.report({
              message: `Use the logical property "${logical}" instead of the physical "${prop}".`,
              loc: toEslintLoc(entry.range),
            })
          }
        },
      }
    },
  }
}
