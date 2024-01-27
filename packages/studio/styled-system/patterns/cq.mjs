import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const cqConfig = {
transform(props) {
  const { name, ...rest } = props;
  return {
    ...rest,
    containerType: "inline-size",
    containerName: name
  };
}}

export const getCqStyle = (styles = {}) => cqConfig.transform(styles, { map: mapObject })

export const cq = (styles) => css(getCqStyle(styles))
cq.raw = getCqStyle