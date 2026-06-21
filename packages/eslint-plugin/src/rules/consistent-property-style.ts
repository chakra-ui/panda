import { type Inspect, type RuleModuleLike, byteToIndex, toEslintLoc } from './shared'

export const consistentPropertyStyleRuleName = 'consistent-property-style'

export interface ConsistentPropertyStyleRuleOptions {
  inspect: Inspect
  /** `shorthand alias -> canonical property`, from `spec.utilities.shorthands`. */
  shorthands: Record<string, string>
}

export function createConsistentPropertyStyleRule(options: ConsistentPropertyStyleRuleOptions): RuleModuleLike {
  // canonical -> its shorthand alias (shortest, then alphabetical, for determinism).
  const aliasOf: Record<string, string> = {}
  for (const [alias, canonical] of Object.entries(options.shorthands)) {
    const current = aliasOf[canonical]
    if (
      current === undefined ||
      alias.length < current.length ||
      (alias.length === current.length && alias < current)
    ) {
      aliasOf[canonical] = alias
    }
  }

  return {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Enforce a consistent property style: Panda shorthand aliases or longhand canonical names.',
      },
      fixable: 'code',
      schema: [
        {
          type: 'object',
          properties: {
            style: { enum: ['shorthand', 'longhand'] },
            ignore: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          },
          additionalProperties: false,
        },
      ],
      messages: {
        useShorthand: 'Use the shorthand "{{target}}" instead of "{{current}}".',
        useLonghand: 'Use the longhand "{{target}}" instead of "{{current}}".',
      },
    },
    create(context) {
      const configured = context.options?.[0] as { style?: 'shorthand' | 'longhand'; ignore?: string[] } | undefined
      const style = configured?.style ?? 'longhand'
      const ignore = new Set(configured?.ignore ?? [])
      const source = context.sourceCode?.text ?? ''

      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return

          for (const entry of inspection.styleEntries) {
            if (entry.kind !== 'utility') continue
            const name = entry.name
            if (ignore.has(name)) continue

            // longhand: an alias maps to its canonical. shorthand: a canonical
            // that has an alias maps to it (skip names already in alias form).
            const target =
              style === 'longhand'
                ? options.shorthands[name]
                : options.shorthands[name] === undefined
                  ? aliasOf[name]
                  : undefined
            if (target === undefined || target === name) continue

            const descriptor: Parameters<typeof context.report>[0] = {
              messageId: style === 'shorthand' ? 'useShorthand' : 'useLonghand',
              data: { target, current: name },
              loc: toEslintLoc(entry.range),
            }

            if (entry.fixable === 'safe' && entry.keySpan && source) {
              const range: [number, number] = [
                byteToIndex(source, entry.keySpan.start),
                byteToIndex(source, entry.keySpan.end),
              ]
              descriptor.fix = (fixer) => fixer.replaceTextRange(range, target)
            }
            context.report(descriptor)
          }
        },
      }
    },
  }
}
