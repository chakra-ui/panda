import { mapObject } from "../helpers"
import { css } from "../css"

const config = {"transform":function(props, { map }) {const { axis = "both", ...rest } = props; return {...rest,position: "absolute",top: map(axis, (v) => v === "x" ? "auto" : "50%"),left: map(axis, (v) => v === "y" ? "auto" : "50%"),transform: map(axis,(v) => v === "both" ? "translate(-50%, -50%)" : v === "x" ? "translateX(-50%)" : "translateY(-50%)")};}}

export const getAbsoluteCenterStyle = (styles) => config.transform(styles, { map: mapObject })

export const absoluteCenter = (styles) => css(getAbsoluteCenterStyle(styles))