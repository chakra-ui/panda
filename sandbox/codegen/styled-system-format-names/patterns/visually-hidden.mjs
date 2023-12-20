import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const visuallyHiddenConfig = {
transform(props) {
  return {
    srOnly: true,
    ...props
  };
}}

export const getVisuallyHiddenStyle = (styles = {}) => visuallyHiddenConfig.transform(styles, { map: mapObject })

export const visuallyHidden = (styles) => css(getVisuallyHiddenStyle(styles))
visuallyHidden.raw = getVisuallyHiddenStyle