import { mapObject } from "../helpers"
import { css } from "../css"

const config = {"transform":function(props) {const { justify, gap = "10px", ...rest } = props; return {display: "flex",alignItems: "center",justifyContent: justify,gap,...rest,flexDirection: "row"};}}

export const getHstackStyle = (styles) => config.transform(styles, { map: mapObject })

export const hstack = (styles) => css(getHstackStyle(styles))