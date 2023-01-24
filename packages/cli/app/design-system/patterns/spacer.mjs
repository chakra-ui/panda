import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const config = {transform(props, { map }) {
  const { axis, size, ...rest } = props;
  return {
    alignSelf: "stretch",
    justifySelf: "stretch",
    flex: map(size, (v) => v == null ? "1" : `0 0 ${v}`),
    ...rest
  };
}}

export const getSpacerStyle = (styles) => config.transform(styles, { map: mapObject })

export const spacer = (styles) => css(getSpacerStyle(styles))