import { walkObject } from '@css-panda/walk-object';
import postcss from 'postcss';

export function createRule(selector: string, entries: [string, string][]) {
  return postcss.rule({
    selector,
    nodes: entries.map(([prop, value]) => postcss.decl({ prop, value })),
  });
}

type CallbackArgs = {
  prop: string;
  value: string;
  conditions: string[];
};

type Callback = (options: CallbackArgs) => string;

export function classNames(props: { [key: string]: any }, callback: Callback) {
  const result = new Set();
  walkObject(props, (value, paths) => {
    const [prop, ...conditions] = paths;
    result.add(callback({ prop, value, conditions }));
  });
  return result;
}
