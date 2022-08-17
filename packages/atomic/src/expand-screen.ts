import { Root } from 'postcss'
import { getBreakpointDetails } from '@css-panda/breakpoint-utils'
import { Dict } from './types'

export function expandScreenAtRule(root: Root, breakpoints: Dict) {
  const bp = getBreakpointDetails(breakpoints)

  root.walkAtRules('screen', (rule) => {
    const dfn = bp[rule.params]
    if (!dfn) {
      throw rule.error(`No \`${screen}\` screen found.`)
    }
    rule.name = 'media'
    rule.params = dfn.minQuery
  })
}
