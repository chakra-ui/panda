import { type Inspect, type RuleModuleLike, toEslintLoc } from './shared'

export const noMarginPropertiesRuleName = 'no-margin-properties'

const MESSAGE = 'Avoid margin properties; prefer `gap` or a layout pattern for spacing.'

export function createNoMarginPropertiesRule(options: { inspect: Inspect }): RuleModuleLike {
  return {
    meta: {
      type: 'suggestion',
      docs: { description: 'Disallow margin properties in favor of gap/layout patterns.' },
      schema: [],
      messages: { margin: MESSAGE },
    },
    create(context) {
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return
          for (const entry of inspection.styleEntries) {
            if (entry.kind !== 'utility') continue
            const prop = entry.canonicalName ?? entry.name
            if (prop.startsWith('margin')) {
              context.report({ messageId: 'margin', loc: toEslintLoc(entry.range) })
            }
          }
        },
      }
    },
  }
}
