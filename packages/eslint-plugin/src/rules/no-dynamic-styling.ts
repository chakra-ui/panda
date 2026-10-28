import { type Inspect, type RuleModuleLike, toEslintLoc } from './shared'

export const noDynamicStylingRuleName = 'no-dynamic-styling'

export function createNoDynamicStylingRule(options: { inspect: Inspect }): RuleModuleLike {
  return {
    meta: {
      type: 'problem',
      docs: { description: "Disallow style values Panda can't read at build time, which get no CSS." },
      schema: [],
      messages: {
        value: "Panda can't read this value at build time, so it generates no CSS for it.",
        fallback: "Panda can't read this value at build time, so it only generates CSS for the fallback.",
        property: "Panda can't read this property name at build time, so it generates no CSS for it.",
        argument: "Panda can't read this argument at build time, so it generates no CSS for it.",
      },
    },
    create(context) {
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return

          for (const site of inspection.dynamicValues) {
            context.report({ messageId: site.kind, loc: toEslintLoc(site.range) })
          }
        },
      }
    },
  }
}
