import { splitProps } from "../helpers.mjs";
import { panda } from "./factory.mjs";

import { createElement, forwardRef } from "react";
import { getAspectRatioStyle } from "../patterns/aspect-ratio.mjs";

export const AspectRatio = /* @__PURE__ */ forwardRef(
  function AspectRatio(props, ref) {
    const [patternProps, restProps] = splitProps(props, ["ratio"]);

    const styleProps = getAspectRatioStyle(patternProps);
    const mergedProps = { ref, ...styleProps, ...restProps };

    return createElement(panda.div, mergedProps);
  },
);
