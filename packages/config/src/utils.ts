const isObject = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export const isFunction = (value: any) => {
  return typeof value === 'function'
}

export function mergeWith(target: any, ...sources: any[]) {
  const customizer = sources.pop()

  for (const source of sources) {
    for (const key in source) {
      const merged = customizer(target[key], source[key])

      if (merged === undefined) {
        if (isObject(target[key]) && isObject(source[key])) {
          target[key] = mergeWith({}, target[key], source[key], customizer)
        } else {
          target[key] = source[key]
        }
      } else {
        target[key] = merged
      }
    }
  }

  return target
}

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
