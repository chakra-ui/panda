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
