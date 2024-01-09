export function fromEntries<A extends symbol | string | number, B>(entries: [A, B][]): { [key in A]: B } {
  const result: { [key in A]: B } = {} as { [key in A]: B }
  entries.forEach((kv) => {
    result[kv[0]] = kv[1]
  })
  return result
}

export function entries<A extends symbol | string | number, B>(obj: { [key in A]: B }): [A, B][] {
  const result: [A, B][] = []
  for (const key in obj) {
    result.push([key, obj[key]] as [A, B])
  }
  return result
}

export function mapEntries<A, B, K extends string | number | symbol>(
  obj: { [key in K]: A },
  f: (key: K, val: A) => [K, B],
): { [key in K]: B } {
  const result: { [key in K]: B } = {} as any
  for (const key in obj) {
    const kv = f(key, obj[key])
    result[kv[0]] = kv[1]
  }
  return result
}
