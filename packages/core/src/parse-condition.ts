import type {
  AtRuleCondition,
  ConditionDetails,
  ConditionObjectQuery,
  ConditionQuery,
  MixedCondition,
  MultiBlockCondition,
  SelectorCondition,
} from '@pandacss/types'
import { AtRule } from 'postcss'
import { safeParse } from './safe-parse'

function parseAtRule(value: string): AtRuleCondition {
  // TODO this creates a new postcss.root for each media query !
  const result = safeParse(value)
  const rule = result.nodes[0] as AtRule
  return {
    type: 'at-rule',
    name: rule.name,
    value: rule.params,
    raw: value,
    params: rule.params,
  }
}

/**
 * Parses an object condition with `@slot` markers into condition blocks.
 * Each path from root to `@slot` becomes an independent condition block.
 *
 * @example
 * ```ts
 * parseObjectCondition({
 *   "@media (hover: hover)": { "&:is(:hover, [data-hover])": "@slot" },
 *   "@media (hover: none)": { "&:is(:active, [data-active])": "@slot" },
 * })
 * ```
 */
function parseObjectCondition(obj: ConditionObjectQuery): MultiBlockCondition | MixedCondition | undefined {
  const blocks: MixedCondition[] = []

  function traverse(node: ConditionObjectQuery, path: string[]) {
    for (const [key, value] of Object.entries(node)) {
      if (value === '@slot') {
        const parts = [...path, key]
        const parsed = parseCondition(parts)
        // parseCondition wraps array input in a MixedCondition (even single-element).
        // Skip blocks where every part failed to parse (no usable conditions).
        if (parsed && parsed.type === 'mixed' && parsed.value.length > 0) {
          blocks.push(parsed)
        }
      } else if (typeof value === 'object' && value !== null) {
        traverse(value, [...path, key])
      }
      // Non-`@slot` string leaves are reported by validateConditions; ignore here.
    }
  }

  traverse(obj, [])

  if (blocks.length === 0) return undefined
  if (blocks.length === 1) return blocks[0]

  return {
    type: 'multi-block',
    value: blocks,
    raw: obj,
  } as MultiBlockCondition
}

export function parseCondition(condition: ConditionQuery): ConditionDetails | undefined {
  if (Array.isArray(condition)) {
    const value = condition.map(parseCondition).filter(Boolean) as ConditionDetails[]
    return {
      type: 'mixed',
      raw: condition,
      value,
    } as MixedCondition
  }

  // Handle object syntax with @slot markers
  if (typeof condition === 'object' && condition !== null) {
    return parseObjectCondition(condition as ConditionObjectQuery)
  }

  if (condition.startsWith('@')) {
    return parseAtRule(condition)
  }

  let type: ConditionDetails['type'] | undefined

  if (condition.startsWith('&')) {
    type = 'self-nesting'
  } else if (condition.endsWith(' &')) {
    type = 'parent-nesting'
  } else if (condition.includes('&')) {
    type = 'combinator-nesting'
  }

  if (type) {
    return { type, value: condition, raw: condition } as SelectorCondition
  }
}
