import { mapObject } from "../helpers"
import { css } from "../css"

const config = {"transform":function(props, { map }) {const { axis, size, ...rest } = props; return {...rest,alignSelf: "stretch",justifySelf: "stretch",flex: map(size, (v) => v == null ? "1" : `0 0 ${v}`)};}}

export const getSpacerStyle = (styles) => config.transform(styles, { map: mapObject })

export const spacer = (styles) => css(getSpacerStyle(styles))