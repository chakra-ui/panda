import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { splitProps } from '../helpers.mjs';
import { getGridItemStyle } from '../patterns/grid-item.mjs';
import { panda } from './factory.mjs';

export const GridItem = /* @__PURE__ */ forwardRef(function GridItem(props, ref) {
  const [patternProps, restProps] = splitProps(props, ["colSpan","rowSpan","colStart","rowStart","colEnd","rowEnd"])

const styleProps = getGridItemStyle(patternProps)
const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(panda.div, mergedProps)
  })