import { toEm, toPx } from '@css-panda/css-unit'

type BuildOptions = {
  min?: string | null
  max?: string | null
}

function buildQuery({ min, max }: BuildOptions) {
  return ['screen', min && `(min-width: ${toEm(min)})`, max && `(max-width: ${toEm(max)})`]
    .filter(Boolean)
    .join(' and ')
}

function queries({ name, min, max }: BuildOptions & { name: string }) {
  return {
    name,
    minQuery: buildQuery({ min }),
    maxQuery: buildQuery({ max }),
    minMaxQuery: buildQuery({ min, max }),
  }
}

export type BreakpointDetail = ReturnType<typeof queries>

export function sortBreakpoints<T extends string>(breakpoints: Record<T, string>): [string, BreakpointDetail][] {
  return Object.entries<any>(breakpoints)
    .sort(([a], [b]) => {
      return parseInt(a, 10) > parseInt(b, 10) ? -1 : 1
    })
    .map(([name, min], index, entries) => {
      let max: string | null = null

      if (index <= entries.length - 1) {
        max = entries[index + 1]?.[1]
      }

      if (max != null) {
        const computedMax = parseFloat(toPx(max) ?? '') - 0.05
        max = `${computedMax}px`
      }

      return [name, queries({ name, min, max })]
    })
}

export function getBreakpointDetails<T extends string>(breakpoints: Record<T, string>) {
  return Object.fromEntries(sortBreakpoints(breakpoints)) as Record<T, BreakpointDetail>
}
