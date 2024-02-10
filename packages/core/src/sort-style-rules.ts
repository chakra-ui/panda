import type { AtomicStyleResult, ConditionDetails } from '@pandacss/types'
import { sortAtRules } from './sort-at-rules'
import { getPropertyPriority } from '@pandacss/shared'

const hasAtRule = (conditions: ConditionDetails[]) => conditions.some((details) => details.type === 'at-rule')
const styleOrder = [':link', ':visited', ':focus-within', ':focus', ':focus-visible', ':hover', ':active']

const pseudoSelectorScore = (selector: string) => {
  const index = styleOrder.findIndex((pseudoClass) => selector.includes(pseudoClass))
  return index + 1
}

const compareConditions = (a: WithConditions, b: WithConditions) => {
  if (a.conditions!.length === b.conditions!.length) {
    const selector1 = a.conditions![0].value
    const selector2 = b.conditions![0].value
    return pseudoSelectorScore(selector1) - pseudoSelectorScore(selector2)
  }

  return a.conditions!.length - b.conditions!.length
}

const compareAtRuleConditions = (a: WithConditions, b: WithConditions) => {
  if (a.conditions!.length === b.conditions!.length) {
    const lastA = a.conditions![a.conditions!.length - 1]
    const lastB = b.conditions![b.conditions!.length - 1]

    const atRule1 = lastA.params ?? lastA.rawValue
    const atRule2 = lastB.params ?? lastB.rawValue

    if (!atRule1 || !atRule2) return 0

    const score = sortAtRules(atRule1, atRule2)
    if (score !== 0) return score

    const selector1 = a.conditions![0].value
    const selector2 = b.conditions![0].value
    return pseudoSelectorScore(selector1) - pseudoSelectorScore(selector2)
  }

  return a.conditions!.length - b.conditions!.length
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
    const conditionDiff = compareConditions(a, b)
    if (conditionDiff !== 0) return conditionDiff

    return sortByPropertyPriority(a, b)
  })
  withAtRules.sort((a, b) => {
    const conditionDiff = compareAtRuleConditions(a, b)
    if (conditionDiff !== 0) return conditionDiff

    return sortByPropertyPriority(a, b)
  })

  const sorted = declarations.sort(sortByPropertyPriority)

  sorted.push(...withSelectorsOnly, ...withAtRules)

  return sorted
}
