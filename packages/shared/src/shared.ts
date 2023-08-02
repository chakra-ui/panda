/**
 * This code is shared between the runtime and cli
 */

export { isObject } from './assert'
export { astish } from './astish'
export { createCss, createMergeCss } from './classname'
export { compact } from './compact'
export { filterBaseConditions, isBaseCondition } from './condition'
export { withoutSpace } from './css-important'
export { toHash } from './hash'
export { hypenateProperty } from './hypenate-property'
export { mergeProps } from './merge-props'
export { normalizeHTMLProps } from './normalize-html'
export { getSlotRecipes, getSlotCompoundVariant } from './slot'
export { splitProps } from './split-props'
export { mapObject, walkObject } from './walk-object'
