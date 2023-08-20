import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const circleConfig = {
  transform(props) {
    const { size, ...rest } = props
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: '0 0 auto',
      width: size,
      height: size,
      borderRadius: '9999px',
      ...rest,
    }
  },
}

export const getCircleStyle = (styles = {}) => circleConfig.transform(styles, { map: mapObject })

export const circle = ({ css: cssStyles, ...styles } = {}) => cx(css(getCircleStyle(styles)), css(cssStyles))
circle.raw = (styles) => styles
