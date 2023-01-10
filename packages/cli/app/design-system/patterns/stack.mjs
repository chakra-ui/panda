import { mapObject } from '../helpers'
import { css } from '../css'

const config = {"transform":function(props) {const { align = "flex-start", justify, direction = "column", gap = "10px", ...rest } = props; return {display: "flex",flexDirection: direction,alignItems: align,justifyContent: justify,gap,...rest};}}

export const getStackStyle = (styles) => config.transform(styles, { map: mapObject })

export const stack = (styles) => css(getStackStyle(styles))