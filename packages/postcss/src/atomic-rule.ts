import postcss from 'postcss';
import { walkObject } from '@css-panda/walk-object';

export function atomicRule(selector: string, props: Record<string, any>) {
  return postcss.rule({
    selector,
    nodes: Object.entries(props).map(([prop, value]) => postcss.decl({ prop, value })),
  });
}

type CallbackArgs = {
  prop: string;
  value: string;
  conditions: string[];
};

type Callback = (options: CallbackArgs) => string;

export function atomicProps(props: { [key: string]: any }, callback: Callback) {
  const result = new Set();
  walkObject(props, (value, paths) => {
    const [prop, ...conditions] = paths;
    result.add(callback({ prop, value, conditions }));
  });
  return result;
}
