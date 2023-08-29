import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const gridConfig = {
transform(props, { map }) {
  const { columnGap, rowGap, gap = columnGap || rowGap ? void 0 : "10px", columns, minChildWidth, ...rest } = props;
  return {
    display: "grid",
    gridTemplateColumns: columns != null ? map(columns, (v) => `repeat(${v}, minmax(0, 1fr))`) : minChildWidth != null ? map(minChildWidth, (v) => `repeat(auto-fit, minmax(${v}, 1fr))`) : void 0,
    gap,
    columnGap,
    rowGap,
    ...rest
  };
}}

export const getGridStyle = (styles = {}) => gridConfig.transform(styles, { map: mapObject })

export const grid = (styles) => css(getGridStyle(styles))
grid.raw = getGridStyle