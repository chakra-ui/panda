export const getArbitraryValue = (value: string) => {
  if (!value) return value

  if (value[0] === '[' && value[value.length - 1] === ']') {
    const innerValue = value.slice(1, -1)
    let bracketCount = 0

    for (let i = 0; i < innerValue.length; i++) {
      if (innerValue[i] === '[') {
        bracketCount++
      } else if (innerValue[i] === ']') {
        if (bracketCount === 0) {
          // Unmatched closing bracket found
          return value
        }
        bracketCount--
      }
    }

    if (bracketCount === 0) {
      // All brackets are balanced
      return innerValue
    }
  }

  return value
}
