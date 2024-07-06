import { splitProps } from "../helpers.mjs";
import { panda } from "./factory.mjs";

import { createElement, forwardRef } from "react";
import { getStackStyle } from "../patterns/stack.mjs";

export const Stack = /* @__PURE__ */ forwardRef(function Stack(props, ref) {
  const [patternProps, restProps] = splitProps(props, [
    "align",
    "justify",
    "direction",
    "gap",
  ]);

  const styleProps = getStackStyle(patternProps);
  const mergedProps = { ref, ...styleProps, ...restProps };

  return createElement(panda.div, mergedProps);
});
