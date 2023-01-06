export const isBaseCondition = (v: string) => v === 'base'

export function filterBaseConditions(c: string[]) {
  return c.slice().filter((v) => !isBaseCondition(v))
}
