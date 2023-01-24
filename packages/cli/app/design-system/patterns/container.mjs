import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const config = {transform(props) {
  const { centerContent, ...rest } = props;
  return {
    position: "relative",
    width: "100%",
    maxWidth: "60ch",
    marginX: "auto",
    ...centerContent && { display: "flex", alignItems: "center", justifyContent: "center" },
    ...rest
  };
}}

export const getContainerStyle = (styles) => config.transform(styles, { map: mapObject })

export const container = (styles) => css(getContainerStyle(styles))