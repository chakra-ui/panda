import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const linkBoxConfig = {
transform(props) {
  return {
    position: "relative",
    "& :where(a, abbr)": {
      position: "relative",
      zIndex: "1"
    },
    ...props
  };
}}

export const getLinkBoxStyle = (styles = {}) => linkBoxConfig.transform(styles, { map: mapObject })

export const linkBox = (styles) => css(getLinkBoxStyle(styles))
linkBox.raw = getLinkBoxStyle