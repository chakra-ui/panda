import { splitProps } from "../helpers.mjs";
import { panda } from "./factory.mjs";

import { createElement, forwardRef } from "react";
import { getSpacerStyle } from "../patterns/spacer.mjs";

export const Spacer = /* @__PURE__ */ forwardRef(function Spacer(props, ref) {
  const [patternProps, restProps] = splitProps(props, ["size"]);

  const styleProps = getSpacerStyle(patternProps);
  const mergedProps = { ref, ...styleProps, ...restProps };

  return createElement(panda.div, mergedProps);
});
