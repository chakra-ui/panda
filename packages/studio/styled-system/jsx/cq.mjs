import { splitProps } from "../helpers.mjs";
import { panda } from "./factory.mjs";

import { createElement, forwardRef } from "react";
import { getCqStyle } from "../patterns/cq.mjs";

export const Cq = /* @__PURE__ */ forwardRef(function Cq(props, ref) {
  const [patternProps, restProps] = splitProps(props, ["name", "type"]);

  const styleProps = getCqStyle(patternProps);
  const mergedProps = { ref, ...styleProps, ...restProps };

  return createElement(panda.div, mergedProps);
});
