export function compact<T extends Record<string, any>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([_, value]) => value !== undefined)) as T
}
