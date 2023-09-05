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
    if (min == null && max == null) return ''
    return ['screen', min && `(min-width: ${min})`, max && `(max-width: ${max})`].filter(Boolean).join(' and ')
  }

  only = (name: string) => {
    const { min, max } = this.get(name)
    return this.build({ min, max })
  }

  get ranges(): Record<string, string> {
    const breakpoints: string[] = Object.keys(this.values)
    const permuations = getPermutations(breakpoints)

    const values = breakpoints
      .flatMap((name) => {
        const value = this.get(name)

        const down: [string, string] = [`${name}Down`, this.build({ max: value.min })]
        const up: [string, string] = [name, this.build({ min: value.min })]
        const only: [string, string] = [`${name}Only`, this.only(name)]

        return [up, only, down]
      })
      .filter(([_, value]) => value !== '')
      .concat(
        permuations.map(([min, max]) => {
          const minValue = this.get(min)
          const maxValue = this.get(max)
          return [`${min}To${capitalize(max)}`, this.build({ min: minValue.min, max: adjust(maxValue.min) })]
        }),
      )

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
    root.walkAtRules('breakpoint', (rule) => {
      const value = this.getCondition(rule.params)
      if (!value) {
        throw rule.error(`No \`${rule.params}\` screen found.`)
      }
      rule.name = 'media'
      rule.params = value.params
    })
  }
}

type Entries = [string, { name: string; min?: string | null; max?: string | null }][]

function adjust(value: string | null | undefined) {
  const computedMax = parseFloat(toPx(value!) ?? '') - 0.05
  return toEm(`${computedMax}px`) as string
}

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
        max = adjust(max)
      }

      return [name, { name, min: toEm(min), max }]
    })
}

type Cond = RawCondition & { params: string }

const toCondition = (key: string, value: string): Cond => ({
  type: 'at-rule',
  name: 'breakpoint',
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
