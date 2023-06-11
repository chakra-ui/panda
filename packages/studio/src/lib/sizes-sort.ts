import { toPx } from '@pandacss/shared'

const num = (v: string | undefined) => parseFloat(toPx(v) ?? '-1')

export function getSortedSizes(sizes: any[]) {
  return sizes.sort((a, b) => {
    if (!a.originalValue || !b.originalValue) return 0
    return num(a.originalValue) - num(b.originalValue)
  })
}
