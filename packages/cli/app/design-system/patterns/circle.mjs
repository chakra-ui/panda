import { mapObject } from '../helpers'
import { css } from '../css'

const config = {transform(props) {
  const { size, ...rest } = props;
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: size,
    height: size,
    borderRadius: "9999px",
    flex: "0 0 auto",
    ...rest
  };
}}

export const getCircleStyle = (styles) => config.transform(styles, { map: mapObject })

export const circle = (styles) => css(getCircleStyle(styles))