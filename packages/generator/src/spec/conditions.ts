import type { Context } from '@pandacss/core'
import type { ConditionSpec } from '@pandacss/types'

export const generateConditionsSpec = (ctx: Context): ConditionSpec => {
  const breakpointKeys = new Set(Object.keys(ctx.conditions.breakpoints.conditions))

  const conditions = Object.entries(ctx.conditions.values).map(([name, detail]) => {
    const value = Array.isArray(detail.raw) ? detail.raw.join(', ') : detail.raw

    // Check if this is a breakpoint condition
    // Breakpoints can be stored with or without underscore prefix
    const nameWithoutUnderscore = name.startsWith('_') ? name.slice(1) : name
    const isBreakpoint = breakpointKeys.has(name) || breakpointKeys.has(nameWithoutUnderscore)

    // For breakpoints, use name without underscore; for others, keep the original name
    const conditionName = isBreakpoint ? nameWithoutUnderscore : name

    return {
      name: conditionName,
      value: value ?? '',
      functionExamples: [
        `css({ margin: { base: '2', ${conditionName}: '4' } })`,
        `css({ margin: '2', ${conditionName}: { margin: '4' } })`,
      ],
      jsxExamples: [
        `<Box margin={{ base: '2', ${conditionName}: '4'}} />`,
        `<Box margin='2' ${conditionName}={{ margin: '4' }} />`,
      ],
    }
  })

  return {
    type: 'conditions',
    data: conditions,
  }
}
