import { splitProps } from "../helpers.mjs";
import { panda } from "./factory.mjs";

import { createElement, forwardRef } from "react";
import { getVisuallyHiddenStyle } from "../patterns/visually-hidden.mjs";

export const VisuallyHidden = /* @__PURE__ */ forwardRef(
  function VisuallyHidden(props, ref) {
    const [patternProps, restProps] = splitProps(props, []);

    const styleProps = getVisuallyHiddenStyle(patternProps);
    const mergedProps = { ref, ...styleProps, ...restProps };

    return createElement(panda.div, mergedProps);
  },
);
