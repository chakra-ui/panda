export function getOrCreateSet<TKey, TValue>(map: Map<TKey, Set<TValue>>, key: TKey) {
  let set = map.get(key)
  if (!set) {
    map.set(key, new Set<TValue>())
    set = map.get(key)!
  }
  return set as Set<TValue>
}
