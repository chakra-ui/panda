import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const aspectRatioConfig = {
transform(props) {
  const { ratio, ...rest } = props;
  return {
    aspectRatio: ratio,
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    "&>img, &>video": {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    ...rest
  };
}}

export const getAspectRatioStyle = (styles = {}) => aspectRatioConfig.transform(styles, { map: mapObject })

export const aspectRatio = (styles) => css(getAspectRatioStyle(styles))