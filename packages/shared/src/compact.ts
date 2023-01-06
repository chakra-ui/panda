export function compact<T extends Record<string, any>>(value: T) {
  if (value == null) return {}
  return Object.fromEntries(Object.entries(value).filter(([_, value]) => value !== undefined)) as T
}
