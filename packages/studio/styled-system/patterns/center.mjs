import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const centerConfig = {
  transform(props) {
    const { inline, ...rest } = props
    return {
      display: inline ? 'inline-flex' : 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...rest,
    }
  },
}

export const getCenterStyle = (styles = {}) => centerConfig.transform(styles, { map: mapObject })

export const center = ({ css: cssStyles, ...styles } = {}) => cx(css(getCenterStyle(styles)), css(cssStyles))
center.raw = (styles) => styles
