const startsWithZero = /^0\d+$/
export function unionType(values: IterableIterator<string> | string[] | readonly string[] | Set<string>) {
  const union: string[] = []
  for (const value of values) {
    const isNumber = !Number.isNaN(Number(value))
    if (isNumber && !startsWithZero.test(value)) union.push(value)
    union.push(JSON.stringify(value))
  }
  return union.join(' | ')
}
