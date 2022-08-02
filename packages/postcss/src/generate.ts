import { walkObject } from '@css-panda/walk-object';
import postcss, { Root } from 'postcss';
import { match } from 'ts-pattern';
import { selectorUtils } from './selector';
import { wrap } from './wrap';
import { expandAtRule, expandSelector, SelectorOutput, toCss } from './__utils';

type Condition = {
  type: 'at-rule' | 'pseudo' | 'selector';
  value: string;
  name?: string;
};

type RawCondition = Condition & { raw: string };

type Conditions = Record<string, Condition>;

type TransformResult = {
  className: string;
  styles: Record<string, any>;
};

type GeneratorContext = {
  root: Root;
  conditions: Conditions;
  transform: (prop: string, value: string) => TransformResult;
};

const dict = {
  display: 'd',
  height: 'h',
  width: 'w',
  minHeight: 'min-h',
  textAlign: 'ta',
};

export function run(fn: Function) {
  const defaultContext: GeneratorContext = {
    root: postcss.root(),
    conditions: {
      sm: { type: 'at-rule', value: 'sm', name: 'screen' },
      md: { type: 'at-rule', value: 'md', name: 'screen' },
      lg: { type: 'at-rule', value: 'lg', name: 'screen' },
      ltr: { type: 'selector', value: '[dir=ltr] &' },
      rtl: { type: 'selector', value: '[dir=rtl] &' },
      light: { type: 'selector', value: '[data-theme=light] &' },
      dark: { type: 'selector', value: '[data-theme=dark] &' },
      hover: { type: 'pseudo', value: '&:hover' },
    },
    transform: (prop, value) => {
      const key = dict[prop] ?? prop;
      return {
        className: `${key}-${value}`,
        styles: { [prop]: value },
      };
    },
  };

  fn(defaultContext);
  return defaultContext.root.toString();
}

function sortByType(values: RawCondition[]) {
  const order = ['pseudo', 'selector', 'at-rule'];
  return values.sort((a, b) => {
    const aIndex = order.indexOf(a.type);
    const bIndex = order.indexOf(b.type);
    return aIndex - bIndex;
  });
}

function expandCondition(value: string, conditionsMap: Conditions): RawCondition {
  for (const [key, cond] of Object.entries(conditionsMap)) {
    if (value === key) return { type: cond.type, value, raw: cond.value, name: cond.name };
  }

  if (value.startsWith('@')) {
    return { ...expandAtRule(value), raw: value };
  }

  return { ...expandSelector(value), raw: value };
}

function expandConditions(values: string[], conditionsMap: Conditions): RawCondition[] {
  return values.map((value) => expandCondition(value, conditionsMap));
}

export function generate(
  styles: Record<string, any>,
  options?: {
    scope?: string;
  }
) {
  const { scope } = options ?? {};

  return (ctx: GeneratorContext) => {
    //
    walkObject(styles, (value, paths) => {
      let [prop, ...conditions] = paths;

      // remove default condition
      conditions = conditions.filter((condition) => condition !== '_');

      // allow users transform the generated class and styles
      const transformed = ctx.transform(prop, value);

      // convert css-in-js to css rule
      const rawNodes = toCss(transformed.styles);

      // get the base class name
      const baseArray = [...conditions, transformed.className];
      if (scope) {
        baseArray.unshift(`[${scope}]`);
        conditions.push(scope.replace('&', 'this'));
      }

      const output: SelectorOutput = {
        before: [],
        between: baseArray.join(':'),
        after: [],
      };

      // create base rule
      let rule: any = postcss.rule({
        selector: selectorUtils.finalize(output),
        nodes: rawNodes,
      });

      // expand conditions and sort based on the insertion order
      const sortedConditions = sortByType(expandConditions(conditions, ctx.conditions));

      for (const cond of sortedConditions) {
        //
        match(cond)
          .with({ type: 'selector' }, (data) => {
            const finalized = selectorUtils.parent(output, data.raw);
            rule = postcss.rule({
              selector: selectorUtils.finalize(finalized),
              nodes: rawNodes,
            });
          })
          .with({ type: 'pseudo' }, (data) => {
            const finalized = selectorUtils.pseudo(output, data.raw);
            rule = postcss.rule({
              selector: selectorUtils.finalize(finalized),
              nodes: rawNodes,
            });
          })
          .with({ type: 'at-rule' }, (data) => {
            rule = wrap(rule, {
              type: data.type,
              name: data.name!,
              params: data.value,
            });
          })
          .exhaustive();
      }

      ctx.root.append(rule);
    });
  };
}
