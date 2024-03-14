export function assign(target: any, ...sources: any[]) {
  for (const source of sources) {
    for (const key in source) {
      if (!target?.hasOwnProperty?.(key)) {
        target[key] = source[key]
      }
    }
  }

  return target
}
