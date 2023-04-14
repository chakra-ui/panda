import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const absoluteCenterConfig = {
transform(props, { map }) {
  const { axis = "both", ...rest } = props;
  return {
    position: "absolute",
    insetBlockStart: map(axis, (v) => v === "x" ? "auto" : "50%"),
    insetInlineStart: map(axis, (v) => v === "y" ? "auto" : "50%"),
    transform: map(
      axis,
      (v) => v === "both" ? "translate(-50%, -50%)" : v === "x" ? "translateX(-50%)" : "translateY(-50%)"
    ),
    maxWidth: "100%",
    maxHeight: "100%",
    ...rest
  };
}}

export const getAbsoluteCenterStyle = (styles) => absoluteCenterConfig.transform(styles, { map: mapObject })

export const absoluteCenter = (styles) => css(getAbsoluteCenterStyle(styles))