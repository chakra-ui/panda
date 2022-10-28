export function splitBy(value: string, separator = ',') {
  const result = []
  let current = ''
  let depth = 0
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (char === '(') {
      depth++
    } else if (char === ')') {
      depth--
    } else if (char === separator && depth === 0) {
      result.push(current)
      current = ''
      continue
    }
    current += char
  }
  result.push(current)
  return result
}

export function splitDotPath(path: string): string[] {
  return path.split('.').reduce((acc, curr) => {
    const last = acc[acc.length - 1]
    if (last != null && !isNaN(Number(last)) && !isNaN(Number(curr))) {
      acc[acc.length - 1] = `${last}.${curr}`
    } else {
      acc.push(curr)
    }
    return acc
  }, [] as string[])
}

export function getNegativePath(path: string[]) {
  return path.slice(0, -1).concat(`-${path.at(-1)}`)
}

export function getDotPath(obj: any, path: string, fallback?: any): any {
  const idx = path.indexOf('.')

  if (idx === -1) {
    return obj?.[path] ?? fallback
  }

  const key = path.slice(0, idx)
  const nextPath = path.slice(idx + 1)

  const checkValue = obj?.[key]?.[nextPath]
  if (checkValue) {
    return checkValue
  }

  return getDotPath(obj?.[key], nextPath, fallback) ?? fallback
}
