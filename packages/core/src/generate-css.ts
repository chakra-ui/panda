import { Dictionary } from '@css-panda/dictionary'

export function generateCss(dict: Dictionary, options?: { root: string }) {
  const { root } = options ?? { root: ':where(:root, :host)' }
}
