import { type Inspect, type RuleModuleLike, toEslintLoc } from './shared'

export const noHardcodedColorRuleName = 'no-hardcoded-color'

const MESSAGE = 'Use a color token instead of the hardcoded value "{{value}}".'

export interface NoHardcodedColorRuleOptions {
  inspect: Inspect
  /** Whether a style property (or its shorthand) accepts color tokens. */
  isColorProperty: (prop: string) => boolean
  /** Whether `value` on `prop` is a hardcoded color (did not resolve to a token). */
  isHardcodedColor: (prop: string, value: string) => boolean
}

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out)
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out)
  }
}

export function createNoHardcodedColorRule(options: NoHardcodedColorRuleOptions): RuleModuleLike {
  return {
    meta: {
      type: 'problem',
      docs: {
        description: 'Report hardcoded color values on color properties.',
      },
      schema: [],
      messages: {
        hardcoded: MESSAGE,
      },
    },
    create(context) {
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return

          for (const entry of inspection.styleEntries) {
            if (entry.kind !== 'utility') continue
            const prop = entry.canonicalName ?? entry.name
            if (!options.isColorProperty(prop)) continue

            const values: string[] = []
            collectStrings(entry.resolvedValue, values)
            const hardcoded = values.find((value) => options.isHardcodedColor(entry.name, value))
            if (hardcoded === undefined) continue

            context.report({
              message: MESSAGE.replace('{{value}}', hardcoded),
              loc: toEslintLoc(entry.range),
            })
          }
        },
      }
    },
  }
}
