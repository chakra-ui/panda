import { mapObject } from "../helpers"
import { css } from "../css"

const config = {"transform":function(props, { map }) {const { colSpan, rowSpan, colStart, rowStart, colEnd, rowEnd, ...rest } = props; return {gridColumn: colSpan != null ? map(colSpan, (v) => v === "auto" ? v : `span ${v}`) : void 0,gridRow: rowSpan != null ? map(rowSpan, (v) => v === "auto" ? v : `span ${v}`) : void 0,...rest,gridColumnEnd: colEnd,gridRowEnd: rowEnd};}}

export const getGridItemStyle = (styles) => config.transform(styles, { map: mapObject })

export const gridItem = (styles) => css(getGridItemStyle(styles))