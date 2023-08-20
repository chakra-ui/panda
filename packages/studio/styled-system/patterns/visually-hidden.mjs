import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const visuallyHiddenConfig = {
  transform(props) {
    return {
      srOnly: true,
      ...props,
    }
  },
}

export const getVisuallyHiddenStyle = (styles = {}) => visuallyHiddenConfig.transform(styles, { map: mapObject })

export const visuallyHidden = ({ css: cssStyles, ...styles } = {}) =>
  cx(css(getVisuallyHiddenStyle(styles)), css(cssStyles))
visuallyHidden.raw = (styles) => styles
