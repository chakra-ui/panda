import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const vstackConfig = {
  transform(props) {
    const { justify, gap = '10px', ...rest } = props
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: justify,
      gap,
      flexDirection: 'column',
      ...rest,
    }
  },
}

export const getVstackStyle = (styles = {}) => vstackConfig.transform(styles, { map: mapObject })

export const vstack = ({ css: cssStyles, ...styles } = {}) => cx(css(getVstackStyle(styles)), css(cssStyles))
vstack.raw = (styles) => styles
