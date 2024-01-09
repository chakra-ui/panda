const importantRegex = /!(important)?/

export function isImportant<T extends string | number | boolean>(value: T) {
  return typeof value === 'string' ? importantRegex.test(value) : false
}

export function withoutImportant<T extends string | number | boolean>(value: T) {
  return typeof value === 'string' ? value.replace(importantRegex, '').trim() : value
}

export function withoutSpace<T extends string | number | boolean>(str: T) {
  return typeof str === 'string' ? str.replaceAll(' ', '_') : str
}

type Dict = Record<string, unknown>

export function markImportant(obj: Dict) {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  const result = Array.isArray(obj) ? [] : {}
  const stack = [{ obj, result }] as { obj: Dict; result: Dict }[]

  while (stack.length > 0) {
    const { obj, result } = stack.pop()!
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' || typeof value === 'number') {
        result[key] = `${value} !important`
      } else if (typeof value === 'object' && value !== null) {
        const next = Array.isArray(value) ? [] : {}
        result[key] = next
        stack.push({ obj: value as Dict, result: next })
      } else {
        result[key] = value
      }
    }
  }

  return result
}
