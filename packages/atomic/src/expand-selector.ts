import { parse, SelectorType as S } from 'css-what';
import postcss, { AtRule } from 'postcss';
import { match, P } from 'ts-pattern';
import { Condition } from './types';

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

export function expandAtRule(value: string) {
  const result = postcss.parse(value);
  const rule = result.nodes[0] as AtRule;
  return {
    name: rule.name,
    value: rule.params,
    type: 'at-rule' as const,
  };
}
