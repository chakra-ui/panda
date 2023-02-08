import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const gridConfig = {transform(props, { map }) {
  const { gapX, gapY, gap = gapX || gapY ? void 0 : "10px", columns, minChildWidth, ...rest } = props;
  return {
    gridTemplateColumns: columns != null ? map(columns, (v) => `repeat(${v}, minmax(0, 1fr))`) : minChildWidth != null ? map(minChildWidth, (v) => `repeat(auto-fit, minmax(${v}, 1fr))`) : void 0,
    display: "grid",
    gap,
    columnGap: gapX,
    rowGap: gapY,
    ...rest
  };
}}

export const getGridStyle = (styles) => gridConfig.transform(styles, { map: mapObject })

export const grid = (styles) => css(getGridStyle(styles))