import { mapObject } from '../helpers'
import { css } from '../css'

const config = {"transform":function(props, { map }) {const { gapX, gapY, gap = gapX || gapY ? void 0 : "10px", columns, minChildWidth, ...rest } = props; return {gridTemplateColumns: columns != null ? map(columns, (v) => `repeat(${v}, minmax(0, 1fr))`) : minChildWidth != null ? map(minChildWidth, (v) => `repeat(auto-fit, minmax(${v}, 1fr))`) : void 0,display: "grid",gap,columnGap: gapX,rowGap: gapY,...rest};}}

export const getGridStyle = (styles) => config.transform(styles, { map: mapObject })

export const grid = (styles) => css(getGridStyle(styles))