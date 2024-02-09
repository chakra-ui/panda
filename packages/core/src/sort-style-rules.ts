import type { AtRuleCondition, AtomicStyleResult, ConditionDetails, SelectorCondition } from '@pandacss/types'
import { sortAtRules } from './sort-at-rules'
import { getPropertyPriority } from '@pandacss/shared'

const hasAtRule = (conditions: ConditionDetails[]) =>
  conditions.some((details) => details.type === 'at-rule' || details.type === 'mixed')
const styleOrder = [':link', ':visited', ':focus-within', ':focus', ':focus-visible', ':hover', ':active']

const pseudoSelectorScore = (selector: string) => {
  const index = styleOrder.findIndex((pseudoClass) => selector.includes(pseudoClass))
  return index + 1
}
const compareSelectors = (a: WithConditions, b: WithConditions) => {
  const aConds = a.conditions! as SelectorCondition[]
  const bConds = b.conditions! as SelectorCondition[]

  if (aConds.length === bConds.length) {
    const selector1 = aConds[0].value
    const selector2 = bConds[0].value

    return pseudoSelectorScore(selector1) - pseudoSelectorScore(selector2)
  }

  return aConds.length - bConds.length
}

const flatten = (conds: ConditionDetails[]) => conds.flatMap((cond) => (cond.type === 'mixed' ? cond.value : cond))

const compareAtRuleOrMixed = (a: WithConditions, b: WithConditions) => {
  const aConds = flatten(a.conditions!) as Array<AtRuleCondition>
  const bConds = flatten(b.conditions!) as Array<AtRuleCondition>

  // Compare lengths first, return difference if not equal
  if (aConds.length !== bConds.length) {
    return aConds.length - bConds.length
  }

  let score = 0,
    aCond,
    bCond

  // Compare each AtRuleCondition
  for (let i = 0; i < aConds.length; i++) {
    aCond = aConds[i]
    bCond = bConds[i]

    if (!aCond || !bCond) {
      continue
    }

    const atRule1 = aConds[i].params ?? aConds[i].raw
    const atRule2 = bConds[i].params ?? bConds[i].raw

    if (!atRule1 || !atRule2) {
      continue
    }

    score = sortAtRules(atRule1, atRule2)
    if (score !== 0) {
      return score
    }
  }

  // If score is still 0, compare pseudo-selectors
  for (let i = 0; i < aConds.length; i++) {
    aCond = aConds[i]
    bCond = bConds[i]

    if (!aCond || !bCond) {
      continue
    }

    score = pseudoSelectorScore(aConds[i].value) - pseudoSelectorScore(bConds[i].value)
    if (score !== 0) {
      return score
    }
  }

  return 0 // Return 0 if all comparisons resulted in a score of 0
}

export interface WithConditions extends Pick<AtomicStyleResult, 'conditions' | 'entry'> {}

const sortByPropertyPriority = (a: WithConditions, b: WithConditions) => {
  return getPropertyPriority(a.entry.prop) - getPropertyPriority(b.entry.prop)
}

/**
 * Sort style rules by conditions
 * - with no conditions first
 * - with selectors only next
 * - with at-rules last
 *
 * for each of them:
 * - sort by condition length (shorter first)
 * - sort selectors by predefined pseudo selector order
 * - sort at-rules by predefined order (sort-mq postcss plugin order)
 * - sort by property priority (longhands first)
 */

export const sortStyleRules = <T extends WithConditions>(styleRules: Array<T>): T[] => {
  const declarations: T[] = []
  const withSelectorsOnly: T[] = []
  const withAtRules: T[] = []

  for (const styleRule of styleRules) {
    if (!styleRule.conditions?.length) {
      declarations.push(styleRule)
    } else if (!hasAtRule(styleRule.conditions)) {
      withSelectorsOnly.push(styleRule)
    } else {
      withAtRules.push(styleRule)
    }
  }

  withSelectorsOnly.sort((a, b) => {
    const conditionDiff = compareSelectors(a, b)
    if (conditionDiff !== 0) return conditionDiff

    return sortByPropertyPriority(a, b)
  })
  withAtRules.sort((a, b) => {
    const conditionDiff = compareAtRuleOrMixed(a, b)
    if (conditionDiff !== 0) return conditionDiff

    return sortByPropertyPriority(a, b)
  })

  const sorted = declarations.sort(sortByPropertyPriority)

  sorted.push(...withSelectorsOnly, ...withAtRules)

  return sorted
}
