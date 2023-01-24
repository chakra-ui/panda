import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const config = {transform(props) {
  return props;
}}

export const getBoxStyle = (styles) => config.transform(styles, { map: mapObject })

export const box = (styles) => css(getBoxStyle(styles))