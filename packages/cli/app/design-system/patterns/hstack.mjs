import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const config = {transform(props) {
  const { justify, gap = "10px", ...rest } = props;
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: justify,
    gap,
    flexDirection: "row",
    ...rest
  };
}}

export const getHstackStyle = (styles) => config.transform(styles, { map: mapObject })

export const hstack = (styles) => css(getHstackStyle(styles))