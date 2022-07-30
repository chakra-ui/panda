import { parse, SelectorType as S, stringify } from 'css-what';
import { isMatching, P } from 'ts-pattern';

function esc(str: string) {
  return str.replace(/[.*+?:^_${}()|[\]\\]/g, '\\$&');
}

export function assert(value: string) {
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
  assert(rawSelector);

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
