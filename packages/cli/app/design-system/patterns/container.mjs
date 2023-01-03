import { mapObject } from "../helpers"
import { css } from "../css"

const config = {"transform":function(props) {const { size, centerContent, ...rest } = props; return {...rest,position: "relative",width: "100%",maxWidth: size,marginX: "auto",paddingX: centerContent ? "1rem" : void 0,...centerContent && { display: "flex", alignItems: "center", justifyContent: "center" }};}}

export const getContainerStyle = (styles) => config.transform(styles, { map: mapObject })

export const container = (styles) => css(getContainerStyle(styles))