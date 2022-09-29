import { match } from 'ts-pattern'
import { formatBoxShadowValue, parseBoxShadowValue } from './parse-shadow'

export function transform(category: string, value: any): string {
  return match(category)
    .with('shadows', () => {
      if (Array.isArray(value)) {
        value = value.join(',')
      }

      const parsedValue = parseBoxShadowValue(value).map((value) => {
        if (value.valid) {
          value.color = `var(--shadow-color, ${value.color})`
        }
        return value
      })

      return formatBoxShadowValue(parsedValue)
    })

    .with('dropShadows', () => {
      if (Array.isArray(value)) {
        value = value.map((value) => `drop-shadow(${value})`).join(' ')
      }

      return value
    })

    .otherwise(() => {
      if (Array.isArray(value)) {
        value = value.join(', ')
      }

      return value
    })
}
