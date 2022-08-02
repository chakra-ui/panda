import postcssJs from 'postcss-js';
import postcss, { AtRule } from 'postcss';
import { parse, SelectorType as S } from 'css-what';
import { match, P } from 'ts-pattern';

export function esc(str: string) {
  return str.replace(/[.*+?&:^>_${}()|[\]\\]/g, '\\$&');
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

type Condition = {
  type: 'at-rule' | 'pseudo' | 'selector';
  value: string;
  name?: string;
};

export function expandSelector(value: string): Condition {
  if (value.startsWith('@')) {
    return { type: 'at-rule', value };
  }
  const [[result]] = parse(value);

  const final = match(result)
    .with({ type: P.union(S.Pseudo, S.PseudoElement) }, () => ({
      type: 'pseudo',
      value,
    }))
    .with({ type: S.Universal }, () => {
      throw new Error('Universal selectors not allowed');
    })
    .otherwise(() => ({
      type: 'selector',
      value,
    }));

  return final as Condition;
}

export type SelectorOutput = {
  before: string[];
  between: string;
  after: string[];
};

export function tap<T>(value: T, cb: (value: T) => void) {
  cb(value);
  return value;
}

export function expandAtRule(value: string) {
  const result = postcss.parse(value);
  const rule = result.nodes[0] as AtRule;
  return { name: rule.name, value: rule.params, type: 'at-rule' as const };
}
