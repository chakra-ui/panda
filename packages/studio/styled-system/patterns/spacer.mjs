import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const spacerConfig = {
  transform(props, { map }) {
    const { size, ...rest } = props
    return {
      alignSelf: 'stretch',
      justifySelf: 'stretch',
      flex: map(size, (v) => (v == null ? '1' : `0 0 ${v}`)),
      ...rest,
    }
  },
}

export const getSpacerStyle = (styles = {}) => spacerConfig.transform(styles, { map: mapObject })

export const spacer = ({ css: cssStyles, ...styles }) => cx(css(getSpacerStyle(styles)), css(cssStyles))
spacer.raw = (styles) => styles
