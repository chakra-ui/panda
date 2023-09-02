import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const styledLinkConfig = {
transform:(props) => ({
  display: "inline-flex",
  alignItems: "center",
  opacity: "0.5",
  borderBottom: "1px solid transparent",
  cursor: "pointer",
  _hover: { opacity: 1, borderBottomColor: "black" },
  ...props
})}

export const getStyledLinkStyle = (styles = {}) => styledLinkConfig.transform(styles, { map: mapObject })

export const styledLink = (styles) => css(getStyledLinkStyle(styles))
styledLink.raw = getStyledLinkStyle