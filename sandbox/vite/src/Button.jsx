import { css, cx } from '../design-system/css'
import { button } from '../design-system/recipes'

export function Button({ children, variant, size, css: cssProp }) {
  return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
}
