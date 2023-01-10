export function unionType(values: IterableIterator<string> | string[] | Set<string>) {
  return Array.from(values)
    .map((value) => JSON.stringify(value))
    .join(' | ')
}
