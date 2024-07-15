import { splitProps } from "../helpers.mjs";
import { panda } from "./factory.mjs";

import { createElement, forwardRef } from "react";
import { getBleedStyle } from "../patterns/bleed.mjs";

export const Bleed = /* @__PURE__ */ forwardRef(function Bleed(props, ref) {
  const [patternProps, restProps] = splitProps(props, ["inline", "block"]);

  const styleProps = getBleedStyle(patternProps);
  const mergedProps = { ref, ...styleProps, ...restProps };

  return createElement(panda.div, mergedProps);
});
