import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const boxConfig = {
  transform(props) {
    return props
  },
}

export const getBoxStyle = (styles = {}) => boxConfig.transform(styles, { map: mapObject })

export const box = ({ css: cssStyles, ...styles }) => cx(css(getBoxStyle(styles)), css(cssStyles))
box.raw = (styles) => styles
