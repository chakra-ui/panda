import { mapObject } from '../helpers'
import { css } from '../css'

const config = {"transform":function(props) {const { direction, align, justify, wrap: wrap2, basis, grow, shrink, ...rest } = props; return {display: "flex",...rest,flexDirection: direction,alignItems: align,justifyContent: justify,flexWrap: wrap2,flexBasis: basis,flexGrow: grow,flexShrink: shrink};}}

export const getFlexStyle = (styles) => config.transform(styles, { map: mapObject })

export const flex = (styles) => css(getFlexStyle(styles))