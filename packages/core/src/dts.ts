import { Dictionary } from '@css-panda/dictionary';

export function generateDts(dict: Dictionary) {
  const union = Array.from(dict.values.keys())
    .map((v) => JSON.stringify(v))
    .join(' | \n');
  return `export type Token = \n${union};`;
}
