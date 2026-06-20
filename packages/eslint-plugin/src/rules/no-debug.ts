import { type Inspect, type RuleModuleLike, toEslintLoc } from './shared'

export const noDebugRuleName = 'no-debug'

const MESSAGE = 'Remove the `debug` property; it logs generated styles and should not ship.'

export interface NoDebugRuleOptions {
  inspect: Inspect
}

export function createNoDebugRule(options: NoDebugRuleOptions): RuleModuleLike {
  return {
    meta: {
      type: 'problem',
      docs: {
        description: 'Report the Panda `debug` property left in source.',
      },
      schema: [],
      messages: {
        debug: MESSAGE,
      },
    },
    create(context) {
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return

          for (const entry of inspection.styleEntries) {
            if (entry.name !== 'debug') continue
            context.report({ message: MESSAGE, loc: toEslintLoc(entry.range) })
          }
        },
      }
    },
  }
}
