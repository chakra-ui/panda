import type { Context } from '@pandacss/core'
import type { ConditionSpec } from '@pandacss/types'
import type { JsxStyleProps } from '../shared'

const generateConditionJsxExamples = (conditionName: string, jsxStyleProps: JsxStyleProps = 'all'): string[] => {
  if (jsxStyleProps === 'all') {
    return [
      `<Box margin={{ base: '2', ${conditionName}: '4' }} />`,
      `<Box margin="2" ${conditionName}={{ margin: '4' }} />`,
    ]
  }
  if (jsxStyleProps === 'minimal') {
    return [
      `<Box css={{ margin: { base: '2', ${conditionName}: '4' } }} />`,
      `<Box css={{ margin: '2', ${conditionName}: { margin: '4' } }} />`,
    ]
  }
  return []
}

/**
 * Walk an object condition collecting every path that ends in `@slot`.
 * Each path is joined with spaces; multiple paths are joined with `; ` so the
 * spec shows a readable, semicolon-separated block list instead of raw JSON.
 */
const formatObjectCondition = (raw: Record<string, any>): string => {
  const blocks: string[] = []
  const walk = (node: Record<string, any>, path: string[]) => {
    for (const [key, value] of Object.entries(node)) {
      if (value === '@slot') {
        blocks.push([...path, key].join(' '))
      } else if (typeof value === 'object' && value !== null) {
        walk(value, [...path, key])
      }
    }
  }
  walk(raw, [])
  return blocks.join('; ')
}

export const generateConditionsSpec = (ctx: Context): ConditionSpec => {
  const jsxStyleProps = ctx.config.jsxStyleProps
  const breakpointKeys = new Set(Object.keys(ctx.conditions.breakpoints.conditions))

  const conditions = Object.entries(ctx.conditions.values).map(([name, detail]) => {
    const value = Array.isArray(detail.raw)
      ? detail.raw.join(', ')
      : typeof detail.raw === 'string'
        ? detail.raw
        : formatObjectCondition(detail.raw)

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
      jsxExamples: generateConditionJsxExamples(conditionName, jsxStyleProps),
    }
  })

  return {
    type: 'conditions',
    data: conditions,
  }
}
