import { capitalize, toEm, toPx } from '@pandacss/shared'
import type { RawCondition } from '@pandacss/types'
import type { Root } from 'postcss'

export class Breakpoints {
  constructor(private breakpoints: Record<string, string>) {}

  get sorted() {
    return sortBreakpoints(this.breakpoints)
  }

  get values() {
    return Object.fromEntries(this.sorted)
  }

  get keys() {
    return ['base', ...Object.keys(this.values)]
  }

  get = (name: string) => {
    return this.values[name]
  }

  build = ({ min, max }: { min?: string | null; max?: string | null }) => {
    return ['screen', min && `(min-width: ${min})`, max && `(max-width: ${max})`].filter(Boolean).join(' and ')
  }

  up = (name: string) => {
    const { min } = this.get(name)
    return this.build({ min })
  }

  down = (name: string) => {
    const { max } = this.get(name)
    return this.build({ max })
  }

  between = (minName: string, maxName: string) => {
    const { min } = this.get(minName)
    const { max } = this.get(maxName)
    return this.build({ min, max })
  }

  only = (name: string) => {
    const { min, max } = this.get(name)
    return this.build({ min, max })
  }

  get ranges(): Record<string, string> {
    const breakpoints: string[] = Object.keys(this.values)
    const permuations = getPermutations(breakpoints)

    const values = breakpoints
      .flatMap((_name, index) => {
        const min = breakpoints[index]
        const up = [min, this.up(min)] as [string, string]
        const only = [`${min}Only`, this.only(min)] as [string, string]
        return [up, only]
      })
      .concat(permuations.map(([min, max]) => [`${min}To${capitalize(max)}`, this.between(min, max)]))

    return Object.fromEntries(values)
  }

  get conditions(): Record<string, Cond> {
    const values = Object.entries(this.ranges).map(([key, value]) => {
      return [key, toCondition(key, value)]
    })

    return Object.fromEntries(values)
  }

  getCondition = (key: string): Cond | undefined => {
    return this.conditions[key]
  }

  expandScreenAtRule = (root: Root) => {
    root.walkAtRules('screen', (rule) => {
      const value = this.getCondition(rule.params)
      if (!value) {
        throw rule.error(`No \`${screen}\` screen found.`)
      }
      rule.name = 'media'
      rule.params = value.params
    })
  }
}

type Entries = [string, { name: string; min: string; max?: string | null }][]

function sortBreakpoints(breakpoints: Record<string, string>): Entries {
  return Object.entries(breakpoints)
    .sort(([, minA], [, minB]) => {
      return parseInt(minA, 10) < parseInt(minB, 10) ? -1 : 1
    })
    .map(([name, min], index, entries) => {
      let max: string | null = null

      if (index <= entries.length - 1) {
        max = entries[index + 1]?.[1]
      }

      if (max != null) {
        const computedMax = parseFloat(toPx(max) ?? '') - 0.05
        max = toEm(`${computedMax}px`)!
      }

      return [name, { name, min, max }]
    })
}

type Cond = RawCondition & { params: string }

const toCondition = (key: string, value: string): Cond => ({
  type: 'at-rule',
  name: 'screen',
  value: key,
  raw: key,
  rawValue: `@media ${value}`,
  params: value,
})

function getPermutations(values: string[]) {
  const result: [string, string][] = []

  values.forEach((current, index) => {
    let idx = index
    idx++
    let next = values[idx]

    while (next) {
      result.push([current, next])
      idx++
      next = values[idx]
    }
  })

  return result
}
