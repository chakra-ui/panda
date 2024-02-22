import type { AtomicStyleResult, ConditionDetails, SelectorCondition } from '@pandacss/types'
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

/**
 * Flatten mixed conditions to Array<AtRuleCondition | SelectorCondition>
 */
const flatten = (conds: ConditionDetails[]) => conds.flatMap((cond) => (cond.type === 'mixed' ? cond.value : cond))

/**
 * Compare 2 Array<AtRuleCondition | SelectorCondition>
 * - sort by condition length (shorter first)
 * - sort at-rules by predefined order (sort-mq postcss plugin order)
 * - sort selectors by predefined pseudo selector order
 * - return 0 if equal
 *
 * do this for item in the array against the same index in the other array
 * -> exit early if not equal
 * -> if all comparisons result in a score of 0, return 0
 */
export const compareAtRuleOrMixed = (a: WithConditions, b: WithConditions) => {
  const aConds = flatten(a.conditions!) as Array<ConditionDetails>
  const bConds = flatten(b.conditions!) as Array<ConditionDetails>

  let aCond, bCond
  const max = Math.max(aConds.length, bConds.length)

  for (let i = 0; i < max; i++) {
    aCond = aConds[i]
    bCond = bConds[i]

    // More nesting should be ranked higher
    // a: [':hover', ':focus'] / b: [':hover'] => a is ranked higher
    if (!aCond) return -1
    if (!bCond) return 1

    // a is at-rule and b is not, a is ranked higher
    // a: ['@media (min-width: 768px)'] b: [':hover', ':focus'] => a is ranked higher
    if (aCond.type === 'at-rule' && bCond.type.includes('nesting')) {
      return 1
    }

    // a is not at-rule and b is, a is ranked lower
    // a: [':hover', ':focus'] b: ['@media (min-width: 768px)'] => a is ranked lower
    if (aCond.type.includes('nesting') && bCond.type === 'at-rule') {
      return -1
    }

    // a & b are at-rules
    // sort by predefined order, return difference if not equal
    // otherwise, keep comparing
    // a: ['@media (min-width: 1024px)'] b: ['@media (min-width: 768px)'] => a is ranked higher
    if (aCond.type === 'at-rule' && bCond.type === 'at-rule') {
      const atRule1 = aCond.params ?? aCond.raw
      const atRule2 = bCond.params ?? bCond.raw

      if (!atRule1) return -1
      if (!atRule2) return 1

      const score = sortAtRules(atRule1, atRule2)

      if (score !== 0) {
        return score
      }

      continue
    }

    // a & b are selectors
    // sort by pseudo selector order, return difference if not equal
    // otherwise, keep comparing
    if (aCond.type.includes('nesting') && bCond.type.includes('nesting')) {
      const nextACond = aConds[i + 1]
      const nextBCond = bConds[i + 1]

      // if a has a next condition and b doesn't, a is ranked higher
      // we will compare the next condition in the next iteration
      // only bother comparing if both have a next condition/neither does = have the same nesting level
      // a: ['@media (min-width: 1024px)', ':hover', ':focus'] b: ['@media (min-width: 1024px)', ':hover'] => a is ranked higher
      if (Boolean(nextACond) === Boolean(nextBCond)) {
        const score =
          pseudoSelectorScore((aCond as SelectorCondition).value) -
          pseudoSelectorScore((bCond as SelectorCondition).value)
        if (score !== 0) {
          return score
        }
      }
    }
  }

  return 0 // Return 0 if all comparisons resulted in a score of 0
}

export interface WithConditions extends Pick<AtomicStyleResult, 'conditions' | 'entry'> {}

const sortByPropertyPriority = (a: WithConditions, b: WithConditions) => {
  if (a.entry.prop === b.entry.prop) return 0
  return getPropertyPriority(a.entry.prop) - getPropertyPriority(b.entry.prop)
}

/**
 * Sort style rules by conditions
 * - with no conditions first
 * - with selectors only next
 * - with at-rules last
 *
 * for each of them:
 * - sort by condition length (shorter first, the more you nest the more specific it is)
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
    const selectorDiff = compareSelectors(a, b)
    if (selectorDiff !== 0) return selectorDiff

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
