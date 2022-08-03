import postcss from 'postcss';
import postcssJs, { CssInJs } from 'postcss-js';
import postcssNested from 'postcss-nested';
import { Dict } from './types';

export function toCss(styles: Dict) {
  return postcss([
    postcssNested({
      bubble: ['screen'],
    }),
  ]).process(styles, {
    parser: postcssJs as CssInJs,
  }).root.nodes;
}
