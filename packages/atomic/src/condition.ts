import { BaseCondition, BaseConditionType, Condition, Conditions } from '@css-panda/types'
import { parse, Selector, SelectorType as S } from 'css-what'
import postcss, { AtRule } from 'postcss'
import { match, P } from 'ts-pattern'

type RawCondition = BaseCondition & { raw: string }

function sort(values: RawCondition[]) {
  const order: BaseConditionType[] = ['pseudo-selector', 'parent-selector', 'at-rule']
  return values.sort((a, b) => {
    const aIndex = order.indexOf(a.type)
    const bIndex = order.indexOf(b.type)
    return aIndex - bIndex
  })
}

function expandSelector(value: string) {
  const [[result]] = parse(value)

  return match<Selector, RawCondition>(result)
    .with({ type: P.union(S.Pseudo, S.PseudoElement, S.Attribute) }, () => ({
      type: 'pseudo-selector',
      value,
      raw: value,
    }))
    .otherwise(() => ({
      type: 'parent-selector',
      value,
      raw: value,
    }))
}

type MixedCondition = Condition | string

export function matchCondition(condition: MixedCondition) {
  return match<MixedCondition, RawCondition>(condition)
    .with(P.string, (value) => {
      if (value.startsWith('@')) {
        const result = postcss.parse(value)
        const rule = result.nodes[0] as AtRule
        return { type: 'at-rule', name: rule.name, value: rule.params, raw: value }
      }
      return expandSelector(value)
    })
    .with({ type: 'color-scheme' }, (cond) => {
      const type = cond.value.startsWith('@') ? 'at-rule' : 'parent-selector'
      return { ...cond, type, raw: cond.value }
    })
    .with({ type: 'screen' }, (cond) => {
      return { ...cond, type: 'at-rule', name: 'screen', raw: cond.value }
    })
    .otherwise((cond: any) => {
      return { ...cond, raw: cond.value }
    })
}

function normalize(conditions: Conditions): Record<string, RawCondition> {
  return Object.fromEntries(Object.entries(conditions).map(([key, value]) => [key, matchCondition(value)]))
}

export function getSortedConditions(condition: string[], conditionsMap: Conditions): RawCondition[] {
  const normalized = normalize(conditionsMap)
  return sort(condition.map((value) => normalized[value] ?? matchCondition(value)))
}

export function getBreakpointConditions(values: Record<string, string>): Conditions {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      {
        type: 'screen',
        value: key,
        rawValue: `@media screen and (min-width: ${value})`,
      },
    ]),
  )
}

export function getMergedConditions({
  breakpoints,
  conditions,
}: {
  breakpoints: Record<string, string>
  conditions: Conditions
}): Conditions {
  return {
    ...conditions,
    ...getBreakpointConditions(breakpoints),
  }
}
