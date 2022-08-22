export function filterDefaults(conditions: string[]) {
  return conditions.slice().filter((v) => !/^(base|_)$/.test(v))
}
