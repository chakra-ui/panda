import { walkObject } from '@pandacss/shared'

export function flatten(values: Record<string, Record<string, any>>) {
  const result: Record<string, any> = {}

  walkObject(values, (token, paths) => {
    result[paths.join('.')] = token
  })

  return result
}
