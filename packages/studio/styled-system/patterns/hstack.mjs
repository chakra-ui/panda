import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const hstackConfig = {
  transform(props) {
    const { justify, gap = '10px', ...rest } = props
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: justify,
      gap,
      flexDirection: 'row',
      ...rest,
    }
  },
}

export const getHstackStyle = (styles = {}) => hstackConfig.transform(styles, { map: mapObject })

export const hstack = ({ css: cssStyles, ...styles }) => cx(css(getHstackStyle(styles)), css(cssStyles))
hstack.raw = (styles) => styles
