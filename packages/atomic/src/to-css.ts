import postcss from 'postcss';
import postcssJs, { CssInJs } from 'postcss-js';
import postcssNested from 'postcss-nested';

export function toCss(styles: Record<string, string>) {
  return postcss([postcssNested()]).process(styles, {
    parser: postcssJs as CssInJs,
  }).root.nodes;
}
