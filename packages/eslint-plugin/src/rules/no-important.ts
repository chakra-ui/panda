import { type Inspect, type RuleModuleLike, toEslintLoc } from './shared'

export const noImportantRuleName = 'no-important'

const MESSAGE = 'Avoid `!important`; it escalates specificity and is hard to override.'

function hasImportant(value: unknown): boolean {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    return v.endsWith('!') || v.endsWith('!important')
  }
  if (Array.isArray(value)) return value.some(hasImportant)
  if (value && typeof value === 'object') return Object.values(value).some(hasImportant)
  return false
}

export function createNoImportantRule(options: { inspect: Inspect }): RuleModuleLike {
  return {
    meta: {
      type: 'problem',
      docs: { description: 'Disallow `!important` in Panda styles.' },
      schema: [],
      messages: { important: MESSAGE },
    },
    create(context) {
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return
          for (const entry of inspection.styleEntries) {
            // Condition/selector entries nest leaf props that report on their own.
            if (entry.kind === 'condition' || entry.kind === 'selector') continue
            if (hasImportant(entry.resolvedValue)) {
              context.report({ message: MESSAGE, loc: toEslintLoc(entry.range) })
            }
          }
        },
      }
    },
  }
}
