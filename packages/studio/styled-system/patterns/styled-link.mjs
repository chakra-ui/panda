import { mapObject } from '../helpers.mjs'
import { css, cx } from '../css/index.mjs'

const styledLinkConfig = {
  transform: (props) => ({
    display: 'inline-flex',
    alignItems: 'center',
    opacity: '0.5',
    borderBottom: '1px solid transparent',
    cursor: 'pointer',
    _hover: { opacity: 1, borderBottomColor: 'black' },
    ...props,
  }),
}

export const getStyledLinkStyle = (styles = {}) => styledLinkConfig.transform(styles, { map: mapObject })

export const styledLink = ({ css: cssStyles, ...styles } = {}) => cx(css(getStyledLinkStyle(styles)), css(cssStyles))
styledLink.raw = (styles) => styles
