import { mapObject } from '../helpers'
import { css } from '../css'

const config = {transform(props) {
  const { justify, gap = "10px", ...rest } = props;
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: justify,
    gap,
    flexDirection: "column",
    ...rest
  };
}}

export const getVstackStyle = (styles) => config.transform(styles, { map: mapObject })

export const vstack = (styles) => css(getVstackStyle(styles))