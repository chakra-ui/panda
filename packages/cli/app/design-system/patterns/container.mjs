import { mapObject } from '../helpers'
import { css } from '../css'

const config = {"transform":function(props) {const { centerContent, ...rest } = props; return {position: "relative",width: "100%",maxWidth: "60ch",marginX: "auto",...centerContent && { display: "flex", alignItems: "center", justifyContent: "center" },...rest};}}

export const getContainerStyle = (styles) => config.transform(styles, { map: mapObject })

export const container = (styles) => css(getContainerStyle(styles))