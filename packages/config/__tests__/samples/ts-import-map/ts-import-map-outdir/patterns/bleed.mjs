import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const bleedConfig = {
transform(props) {
  const { inline = "0", block = "0", ...rest } = props;
  return {
    "--bleed-x": `spacing.${inline}`,
    "--bleed-y": `spacing.${block}`,
    marginInline: "calc(var(--bleed-x, 0) * -1)",
    marginBlock: "calc(var(--bleed-y, 0) * -1)",
    ...rest
  };
}}

export const getBleedStyle = (styles = {}) => bleedConfig.transform(styles, { map: mapObject })

export const bleed = (styles) => css(getBleedStyle(styles))
bleed.raw = getBleedStyle