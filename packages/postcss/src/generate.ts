import { walkObject } from '@css-panda/walk-object';
import postcss, { Root } from 'postcss';
import { match } from 'ts-pattern';
import { parentSelector, pseudoSelector } from './selector';
import { wrap } from './wrap';
import { esc, toCss } from './__utils';

type Condition = {
  type: 'at-rule' | 'pseudo' | 'selector';
  value: string;
};

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
      sm: { type: 'at-rule', value: 'sm' },
      md: { type: 'at-rule', value: 'md' },
      lg: { type: 'at-rule', value: 'lg' },
      ltr: { type: 'selector', value: '[dir=ltr] &' },
      rtl: { type: 'selector', value: '[dir=rtl] &' },
      light: { type: 'selector', value: '.light &' },
      dark: { type: 'selector', value: '.dark &' },
      hover: { type: 'pseudo', value: '&:hover' },
    },
    transform: (prop, value) => {
      const key = dict[prop] ?? prop;
      return {
        className: `${key}:${value}`,
        styles: { [prop]: value },
      };
    },
  };

  fn(defaultContext);
  return defaultContext.root.toString();
}

function sortByType(values: Condition[]) {
  const order = ['pseudo', 'selector', 'at-rule'];
  return values
    .sort((a, b) => {
      const aIndex = order.indexOf(a.type);
      const bIndex = order.indexOf(b.type);
      return aIndex - bIndex;
    })
    .map(({ value }) => value);
}

function expandCondition(value: string, conditionsMap: Conditions): Condition {
  for (const [key, { type }] of Object.entries(conditionsMap)) {
    if (value === key) return { type, value };
  }
  return { type: 'selector', value };
}

function expandConditions(values: string[], conditionsMap: Conditions): Condition[] {
  return values.map((value) => expandCondition(value, conditionsMap));
}

export function generate(props: Record<string, any>) {
  const { '@media': mq, selectors, ...styles } = props;

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
      const base = [...conditions, transformed.className].join(':');

      // create base rule
      let rule: any = postcss.rule({
        selector: `.${esc(base)}`,
        nodes: rawNodes,
      });

      // expand conditions and sort based on the insertion order
      const sortedConditions = sortByType(expandConditions(conditions, ctx.conditions));

      for (const condition of sortedConditions) {
        //
        const cond = ctx.conditions[condition];

        match(cond)
          .with({ type: 'selector' }, (data) => {
            const finalized = parentSelector(base, data.value);
            rule = postcss.rule({
              selector: finalized.selector.join(' '),
              nodes: rawNodes,
            });
          })
          .with({ type: 'pseudo' }, (data) => {
            const finalized = pseudoSelector(base, data.value);
            rule = postcss.rule({
              selector: finalized.selector.join(' '),
              nodes: rawNodes,
            });
          })
          .with({ type: 'at-rule' }, (data) => {
            rule = wrap(rule, {
              type: data.type,
              name: 'screen',
              params: data.value,
            });
          })
          .exhaustive();
      }

      ctx.root.append(rule);
    });
  };
}
