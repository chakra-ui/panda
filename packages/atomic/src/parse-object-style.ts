import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import postcssJs from 'postcss-js';
import { CSSProperties } from '@css-panda/types';

export default function parseObjectStyles(styles: CSSProperties) {
  return postcss([
    postcssNested({
      bubble: ['screen'],
    }),
  ]).process(styles, {
    // @ts-ignore
    parser: postcssJs,
  }).root.nodes;
}
