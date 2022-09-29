export const isBaseCondition = (c: string) => /^(base|_)$/.test(c)

export function filterBaseConditions(c: string[]) {
  return c.slice().filter((v) => !isBaseCondition(v))
}
