export function formatNegativeValue(value: any, format: (token: string) => string) {
  const valueString = value.toString()

  const isNegative = valueString.startsWith('-')
  const absValue = isNegative ? valueString.slice(1) : valueString

  if (valueString === '__ignore__') return valueString
  return `${isNegative ? '-' : ''}${format(absValue)}`
}
