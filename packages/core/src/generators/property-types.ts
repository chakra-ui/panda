import { CSSUtility } from '@css-panda/css-utility'

export function generatePropertyTypes(utility: CSSUtility) {
  const result: string[] = ['interface PropertyTypes {']
  for (const [prop, values] of utility.valuesMap.entries()) {
    result.push(
      `\t${prop}: ${Array.from(values)
        .map((key) => JSON.stringify(key))
        .join(' | ')};`,
    )
  }
  result.push('}')
  return result.join('\n')
}
