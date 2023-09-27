import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const flexConfig = {
transform(props) {
  const { direction, align, justify, wrap: wrap2, basis, grow, shrink, ...rest } = props;
  return {
    display: "flex",
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap2,
    flexBasis: basis,
    flexGrow: grow,
    flexShrink: shrink,
    ...rest
  };
}}

export const getFlexStyle = (styles = {}) => flexConfig.transform(styles, { map: mapObject })

export const flex = (styles) => css(getFlexStyle(styles))
flex.raw = getFlexStyle