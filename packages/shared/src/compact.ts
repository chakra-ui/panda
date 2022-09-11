export function compact<T>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([_, value]) => value !== undefined)) as T
}
