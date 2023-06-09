import { walkObject } from '@pandacss/shared'

type Dict = Record<string, any>

export function flatten(values: Record<string, Dict>) {
  const result: Dict = {}

  walkObject(values, (token, paths) => {
    result[paths.join('.')] = token
  })

  return result
}
