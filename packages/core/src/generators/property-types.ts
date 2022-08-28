import { CSSUtility } from '@css-panda/css-utility'

export function generatePropertyTypes(utility: CSSUtility) {
  const result: string[] = [
    'import { Properties as CSSProperties } from "./csstype"',
    '',
    'export type PropertyTypes  = {',
  ]
  for (const [prop, values] of utility.valuesMap.entries()) {
    result.push(
      `\t${prop}: ${Array.from(values)
        .map((key) => {
          if (key.startsWith('CSSProperties')) return key
          if (key.startsWith('__type__')) return key.replace('__type__', '')
          return JSON.stringify(key)
        })
        .join(' | ')};`,
    )
  }
  result.push('}')
  return result.join('\n')
}
