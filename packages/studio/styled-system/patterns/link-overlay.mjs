import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const linkOverlayConfig = {
  transform(props) {
    return {
      position: 'static',
      _before: {
        content: '""',
        display: 'block',
        position: 'absolute',
        cursor: 'inherit',
        inset: '0',
        zIndex: '0',
        ...props['_before'],
      },
      ...props,
    }
  },
}

export const getLinkOverlayStyle = (styles = {}) => linkOverlayConfig.transform(styles, { map: mapObject })

export const linkOverlay = ({ css: cssStyles, ...styles }) => cx(css(getLinkOverlayStyle(styles)), css(cssStyles))
linkOverlay.raw = (styles) => styles
