export const getArbitraryValue = (value: string) => {
  if (!value) return value

  if (value[0] === '[' && value[value.length - 1] === ']') {
    return value.slice(1, -1)
  }

  return value
}
