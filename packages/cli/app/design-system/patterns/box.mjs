import { mapObject } from '../helpers'
import { css } from '../css'

const config = {transform(props) {
  return props;
}}

export const getBoxStyle = (styles) => config.transform(styles, { map: mapObject })

export const box = (styles) => css(getBoxStyle(styles))