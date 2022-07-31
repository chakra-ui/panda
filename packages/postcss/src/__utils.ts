import postcssJs from 'postcss-js';
import postcss from 'postcss';
import { parse } from 'css-what';

export function esc(str: string) {
  return str.replace(/[.*+?:^_${}()|[\]\\]/g, '\\$&');
}

export function toCss(styles: Record<string, string>) {
  //@ts-ignore
  return postcss().process(styles, { parser: postcssJs }).root.nodes;
}

export function validateSelector(value: string) {
  const thisCount = value.match(/&/g)?.length ?? 0;

  if (thisCount === 0) {
    throw new Error(`Invalid selector: ${value}. must have & or an at-rule. Ignoring...`);
  }

  if (thisCount > 1) {
    throw new Error(`Invalid selector: ${value}. You can only have one self selector`);
  }

  if (value.includes(',')) {
    throw new Error("Invalid selector: can't have multiple selectors in one rule. Ignoring...");
  }
}

export function expandSelector(value: string) {
  if (value.startsWith('@')) {
    return { type: 'at-rule', value };
  }
  const [[result]] = parse(value);
  return { type: result.type, value };
}
