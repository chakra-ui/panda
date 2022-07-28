import { calc } from '@css-panda/calc';
import { Tokens, TSemanticTokens } from '@css-panda/types';
import { createVar } from './css-var';
import { getColorsMap, getTokenMap } from './token-map';

type DictionaryItem = {
  value: string;
  var: string;
  varRef: string;
};

type Dictionary = {
  map: Map<string, DictionaryItem>;
  vars: Map<string, string>;
};

function withNegativeToken(
  category: string,
  values: Record<string, string> | undefined
) {
  return (dict: Dictionary) => {
    if (!values) return;
    const entries = getTokenMap(values).entries();

    for (const [key, value] of entries) {
      const base = createVar(key, { prefix: category });

      const positive = {
        value,
        var: base.var,
        varRef: base.ref,
      };

      dict.map.set(`${category}.${key}`, positive);
      dict.vars.set(base.var, value);

      const negative = {
        value: `-${value}`,
        var: base.var,
        varRef: calc.negate(base.ref),
      };

      dict.map.set(`${category}.-${key}`, negative);
      dict.vars.set(base.var, `-${value}`);
    }
  };
}

function withToken(
  category: string,
  values: Record<string, string> | undefined
) {
  return (dict: Dictionary) => {
    if (!values) return;
    const getter = category === 'colors' ? getColorsMap : getTokenMap;
    const entries = getter(values).entries();

    for (const [key, value] of entries) {
      const base = createVar(key, { prefix: category });

      const obj = {
        value,
        var: base.var,
        varRef: base.ref,
      };

      dict.map.set(`${category}.${key}`, obj);
      dict.vars.set(base.var, value);
    }
  };
}

export function createTokenDictionary(
  tokens: Partial<Tokens>,
  semanticTokens?: TSemanticTokens
): Dictionary {
  const dict: Dictionary = {
    map: new Map(),
    vars: new Map(),
  };

  const { spacing, ...otherTokens } = tokens;

  withNegativeToken('spacing', spacing)(dict);
  for (const [key, value] of Object.entries(otherTokens)) {
    withToken(key, value)(dict);
  }

  return dict;
}
