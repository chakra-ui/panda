import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const stackConfig = {
transform(props) {
  const { align, justify, direction = "column", gap = "10px", ...rest } = props;
  return {
    display: "flex",
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    gap,
    ...rest
  };
}}

export const getStackStyle = (styles = {}) => stackConfig.transform(styles, { map: mapObject })

export const stack = (styles) => css(getStackStyle(styles))
stack.raw = getStackStyle