import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const linkBoxConfig = {
  transform(props) {
    return {
      position: 'relative',
      '& :where(a, abbr)': {
        position: 'relative',
        zIndex: '1',
      },
      ...props,
    }
  },
}

export const getLinkBoxStyle = (styles = {}) => linkBoxConfig.transform(styles, { map: mapObject })

export const linkBox = ({ css: cssStyles, ...styles } = {}) => cx(css(getLinkBoxStyle(styles)), css(cssStyles))
linkBox.raw = (styles) => styles
