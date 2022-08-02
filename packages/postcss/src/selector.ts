import { parse, SelectorType as S, stringify } from 'css-what';
import { isMatching } from 'ts-pattern';
import { esc, SelectorOutput, tap, validateSelector } from './__utils';

type SelectorsReturn = {
  selector: string[];
  raw: string[];
  entry: [string, string];
};

const isThisType = isMatching({
  type: S.Tag,
  name: 'this',
});

const identity = <T>(v: T) => v;

type Callback = (value: string, conditions: string[]) => string;

export function selectors(paths: string[], value: string, cb: Callback = identity): SelectorsReturn {
  const [rawSelector, prop, ...conditions] = paths;
  validateSelector(rawSelector);

  const result: SelectorsReturn = {
    raw: [],
    selector: [],
    entry: [prop, value],
  };

  const selector = rawSelector.replace(/&/g, 'this');
  const [nodes] = parse(selector);

  const base = [`[${rawSelector}]`, ...conditions, prop, value].join(':');

  if (isThisType(nodes[0])) {
    const others = nodes.slice(1);
    const suffix = cb(stringify([others]), conditions);

    result.selector = [esc(base) + suffix];
    result.raw = [base + suffix];

    return result;
  }

  const [before, after] = selector.split('this').map((t) => t.trim());
  const suffix = cb(after, conditions);

  result.selector = [before, esc(base) + suffix];
  result.raw = [before, base + suffix];

  return result;
}

export const selectorUtils = {
  pseudo(output: SelectorOutput, selector: string): SelectorOutput {
    const after = selector.replace(/^&/, '');
    return tap(output, (v) => {
      v.after = [...v.after, after].filter(Boolean);
    });
  },

  parent(output: SelectorOutput, selector: string): SelectorOutput {
    const [before = '', after = ''] = selector.split('&').map((t) => t.trim());
    return tap(output, (v) => {
      v.before = [...v.before, before].filter(Boolean);
      v.after = [...v.after, after].filter(Boolean);
    });
  },

  finalize(output: SelectorOutput) {
    const { before, after, between } = output;

    const _this = `.${esc(between)}${after.join('')}`;
    const _before = before.join(' ');

    if (_before.includes('this')) {
      return _before.replace('this', _this);
    }
    return `${_before} ${_this}`;
  },
};
