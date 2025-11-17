import { getPatternStyles, patternFns } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const flexConfig = {
transform(props) {
  const { display: display2 = "flex", flex: flex2, direction, align, justify, wrap: wrap2, basis, grow, shrink, ...rest } = props;
  return {
    display: display2,
    flex: flex2,
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap2,
    flexBasis: basis,
    flexGrow: grow,
    flexShrink: shrink,
    ...rest
  };
},
defaultValues:{display:'flex'}}

export const getFlexStyle = (styles = {}) => {
  const _styles = getPatternStyles(flexConfig, styles)
  return flexConfig.transform(_styles, patternFns)
}

export const flex = (styles) => css(getFlexStyle(styles))
flex.raw = getFlexStyle