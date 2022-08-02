import postcss from 'postcss';
import postcssJs from 'postcss-js';

export function toCss(styles: Record<string, string>) {
  //@ts-ignore
  return postcss().process(styles, { parser: postcssJs }).root.nodes;
}
