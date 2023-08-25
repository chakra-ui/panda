import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const boxConfig = {
transform(props) {
  return props;
}}

export const getBoxStyle = (styles = {}) => boxConfig.transform(styles, { map: mapObject })

export const box = (styles) => css(getBoxStyle(styles))
box.raw = getBoxStyle