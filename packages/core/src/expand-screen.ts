import { getBreakpointDetails } from '@css-panda/breakpoint-utils'
import type { Root } from 'postcss'
import type { Dict } from './types'

export function expandScreenAtRule(root: Root, breakpoints: Dict) {
  const bp = getBreakpointDetails(breakpoints)

  root.walkAtRules('screen', (rule) => {
    const isExact = rule.params.endsWith('_only')
    const name = isExact ? rule.params.slice(0, -5) : rule.params
    const dfn = bp[name]
    if (!dfn) {
      throw rule.error(`No \`${screen}\` screen found.`)
    }
    rule.name = 'media'
    rule.params = isExact ? dfn.minMaxQuery : dfn.minQuery
  })
}
