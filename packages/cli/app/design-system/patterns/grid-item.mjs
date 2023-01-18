import { mapObject } from '../helpers'
import { css } from '../css'

const config = {transform(props, { map }) {
  const { colSpan, rowSpan, colStart, rowStart, colEnd, rowEnd, ...rest } = props;
  const spanFn = (v) => v === "auto" ? v : `span ${v}`;
  return {
    gridColumn: colSpan != null ? map(colSpan, spanFn) : void 0,
    gridRow: rowSpan != null ? map(rowSpan, spanFn) : void 0,
    gridColumnEnd: colEnd,
    gridRowEnd: rowEnd,
    ...rest
  };
}}

export const getGridItemStyle = (styles) => config.transform(styles, { map: mapObject })

export const gridItem = (styles) => css(getGridItemStyle(styles))