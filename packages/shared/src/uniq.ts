export const uniq = <T>(...items: T[][]): T[] =>
  items.filter(Boolean).reduce<T[]>((acc, item) => Array.from(new Set([...acc, ...item])), [])
