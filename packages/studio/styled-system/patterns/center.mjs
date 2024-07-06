import { css } from "../css/index.mjs";
import { getPatternStyles, patternFns } from "../helpers.mjs";

const centerConfig = {
  transform(props) {
    const { inline, ...rest } = props;
    return {
      display: inline ? "inline-flex" : "flex",
      alignItems: "center",
      justifyContent: "center",
      ...rest,
    };
  },
};

export const getCenterStyle = (styles = {}) => {
  const _styles = getPatternStyles(centerConfig, styles);
  return centerConfig.transform(_styles, patternFns);
};

export const center = (styles) => css(getCenterStyle(styles));
center.raw = getCenterStyle;
