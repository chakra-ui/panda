import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const squareConfig = {
transform(props) {
  const { size, ...rest } = props;
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
    width: size,
    height: size,
    ...rest
  };
}}

export const getSquareStyle = (styles = {}) => squareConfig.transform(styles, { map: mapObject })

export const square = (styles) => css(getSquareStyle(styles))