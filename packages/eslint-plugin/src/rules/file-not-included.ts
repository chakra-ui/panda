import { getContextFilename } from '../core'
import type { Inspect, RuleModuleLike } from './shared'

export const fileNotIncludedRuleName = 'file-not-included'

export interface FileNotIncludedRuleOptions {
  inspect: Inspect
  isSourceFile: (path: string) => boolean
}

const MESSAGE =
  'This file uses Panda but is not part of the Panda config `include` globs, so its styles will not be generated.'

export function createFileNotIncludedRule(options: FileNotIncludedRuleOptions): RuleModuleLike {
  return {
    meta: {
      type: 'problem',
      docs: {
        description: 'Report files that use Panda but are excluded from the config `include` globs.',
      },
      schema: [],
      messages: {
        notIncluded: MESSAGE,
      },
    },
    create(context) {
      return {
        Program() {
          const path = getContextFilename(context)
          if (options.isSourceFile(path)) return

          const inspection = options.inspect(context)
          if (!inspection) return

          const usesPanda =
            inspection.calls.length > 0 ||
            inspection.jsx.length > 0 ||
            inspection.styleEntries.length > 0 ||
            inspection.tokenRefs.length > 0
          if (!usesPanda) return

          context.report({
            messageId: 'notIncluded',
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
          })
        },
      }
    },
  }
}
