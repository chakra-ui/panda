import { parse as baseParse } from 'vue-eslint-parser'

export function parse(code: string) {
  return baseParse(code, { sourceType: 'module' })
}

export const noop = () => void 0

export type Options = {
  match: (name: string) => boolean
  fn(result: { name: string; data: any }): void
}
