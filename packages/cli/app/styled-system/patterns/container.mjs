import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const containerConfig = {
transform(props, { map }) {
  const { size, ...rest } = props;
  return {
    position: "relative",
    width: "100%",
    maxWidth: size != null ? map(size, (v) => `breakpoint-${v}`) : "60ch",
    marginX: "auto",
    ...rest
  };
}}

export const getContainerStyle = (styles = {}) => containerConfig.transform(styles, { map: mapObject })

export const container = (styles) => css(getContainerStyle(styles))