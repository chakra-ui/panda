import { mapObject } from '../helpers.mjs'
import { css } from '../css/index.mjs'

const dividerConfig = {
  transform(props, { map }) {
    const { orientation = 'horizontal', thickness = '1px', color, ...rest } = props
    return {
      '--thickness': thickness,
      width: map(orientation, (v) => (v === 'vertical' ? void 0 : '100%')),
      height: map(orientation, (v) => (v === 'horizontal' ? void 0 : '100%')),
      borderBlockEndWidth: map(orientation, (v) => (v === 'horizontal' ? 'var(--thickness)' : void 0)),
      borderInlineEndWidth: map(orientation, (v) => (v === 'vertical' ? 'var(--thickness)' : void 0)),
      borderColor: color,
      ...rest,
    }
  },
}

export const getDividerStyle = (styles = {}) => dividerConfig.transform(styles, { map: mapObject })

export const divider = (styles) => css(getDividerStyle(styles))
divider.raw = (styles) => styles
