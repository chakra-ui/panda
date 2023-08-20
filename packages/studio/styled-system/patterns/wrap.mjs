import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const wrapConfig = {
  transform(props) {
    const { columnGap, rowGap, gap = columnGap || rowGap ? void 0 : '10px', align, justify, ...rest } = props
    return {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: align,
      justifyContent: justify,
      gap,
      columnGap,
      rowGap,
      ...rest,
    }
  },
}

export const getWrapStyle = (styles = {}) => wrapConfig.transform(styles, { map: mapObject })

export const wrap = ({ css: cssStyles, ...styles }) => cx(css(getWrapStyle(styles)), css(cssStyles))
wrap.raw = (styles) => styles
