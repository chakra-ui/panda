import { splitProps } from "../helpers.mjs";
import { panda } from "./factory.mjs";

import { createElement, forwardRef } from "react";
import { getContainerStyle } from "../patterns/container.mjs";

export const Container = /* @__PURE__ */ forwardRef(
  function Container(props, ref) {
    const [patternProps, restProps] = splitProps(props, []);

    const styleProps = getContainerStyle(patternProps);
    const mergedProps = { ref, ...styleProps, ...restProps };

    return createElement(panda.div, mergedProps);
  },
);
