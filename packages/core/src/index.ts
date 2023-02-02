export { Breakpoints } from './breakpoints'
export { assignCompositions } from './compositions'
export { Conditions } from './conditions'
export { toKeyframeCss } from './keyframes'
export { mergeCss } from './merge-css'
export { discardDuplicate, expandCssFunctions, expandNestedCss, optimizeCss, prettifyCss } from './optimize'
export { Recipe } from './recipe'
export { extractParentSelectors } from './selector'
export { getStaticCss } from './static-css'
export { Stylesheet, type StylesheetOptions } from './stylesheet'
export { toCss } from './to-css'
export type { StylesheetContext } from './types'
export { Utility } from './utility'
import postcss from 'postcss'

export function createRoot() {
  return postcss.root()
}
