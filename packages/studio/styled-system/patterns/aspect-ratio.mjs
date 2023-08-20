import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const aspectRatioConfig = {
  transform(props, { map }) {
    const { ratio = 4 / 3, ...rest } = props
    return {
      position: 'relative',
      _before: {
        content: `""`,
        display: 'block',
        height: '0',
        paddingBottom: map(ratio, (r) => `${(1 / r) * 100}%`),
      },
      '&>*': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
      },
      '&>img, &>video': {
        objectFit: 'cover',
      },
      ...rest,
    }
  },
}

export const getAspectRatioStyle = (styles = {}) => aspectRatioConfig.transform(styles, { map: mapObject })

export const aspectRatio = ({ css: cssStyles, ...styles } = {}) => cx(css(getAspectRatioStyle(styles)), css(cssStyles))
aspectRatio.raw = (styles) => styles
