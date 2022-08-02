import postcss, { AtRule, Rule } from 'postcss';
import { match } from 'ts-pattern';

type Options =
  | {
      type: 'selector';
      name: string;
    }
  | {
      type: 'at-rule';
      name: string;
      params: string;
    };

export function wrap(rule: Rule | AtRule, options: Options) {
  const parent = match(options)
    .with({ type: 'at-rule' }, ({ name, params }) => postcss.atRule({ name, params }))
    .with({ type: 'selector' }, ({ name }) => postcss.rule({ selector: name }))
    .exhaustive();

  const cloned = rule.clone();

  parent.append(cloned);
  rule.remove();

  return parent;
}
