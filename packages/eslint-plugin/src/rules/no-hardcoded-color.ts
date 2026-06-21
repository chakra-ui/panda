import { type Inspect, type RuleModuleLike } from './shared'
import { reportTokenViolations } from './prefer-token'

export const noHardcodedColorRuleName = 'no-hardcoded-color'

const COLORS = new Set(['colors'])

export interface NoHardcodedColorRuleOptions {
  inspect: Inspect
  /** Property (canonical) → its token category, or `undefined` if not token-backed. */
  categoryOf: (prop: string) => string | undefined
  /** Whether `value` on `prop` resolved to a raw value rather than a token var. */
  isHardcodedValue: (prop: string, value: string) => boolean
}

/** `prefer-token` fixed to the `colors` category with a color-specific message. */
export function createNoHardcodedColorRule(options: NoHardcodedColorRuleOptions): RuleModuleLike {
  return {
    meta: {
      type: 'problem',
      docs: { description: 'Report hardcoded color values on color properties.' },
      schema: [],
      messages: { hardcoded: '{{message}}' },
    },
    create(context) {
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return
          reportTokenViolations(context, inspection, {
            categoryOf: options.categoryOf,
            isHardcodedValue: options.isHardcodedValue,
            categories: COLORS,
            allow: new Set(),
            message: (_category, value) => `Use a color token instead of the hardcoded value "${value}".`,
          })
        },
      }
    },
  }
}
