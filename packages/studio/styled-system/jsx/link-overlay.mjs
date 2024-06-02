import { splitProps } from "../helpers.mjs";
import { panda } from "./factory.mjs";

import { createElement, forwardRef } from "react";
import { getLinkOverlayStyle } from "../patterns/link-overlay.mjs";

export const LinkOverlay = /* @__PURE__ */ forwardRef(
  function LinkOverlay(props, ref) {
    const [patternProps, restProps] = splitProps(props, []);

    const styleProps = getLinkOverlayStyle(patternProps);
    const mergedProps = { ref, ...styleProps, ...restProps };

    return createElement(panda.a, mergedProps);
  },
);
