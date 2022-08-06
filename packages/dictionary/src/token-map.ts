import { TokenError } from '@css-panda/error';
import type { TSemanticToken } from '@css-panda/types';
import { walkObject } from '@css-panda/walk-object';

export function getTokenMap(values: Record<string, any>, options: { maxDepth?: number } = {}) {
  const { maxDepth = 1 } = options;

  const map = new Map<string, string>();

  walkObject(
    values,
    (value, path) => {
      
        map.set(path.join('.'), value);
      
    },
    { maxDepth }
  );

  return map;
}

export function getSemanticTokenMap(values: TSemanticToken) {
  const map = new Map<string, Map<string, string>>();

  walkObject(values, (value, path) => {
    if (path.length > 2) {
      throw new TokenError('[semantic-token] Expect token to be 2-levels deep');
    }

    const [key, condition] = path;
    const isDefault = condition === '_';

    let prop = isDefault ? 'raw' : condition;

    if (!map.has(prop)) {
      map.set(prop, new Map());
    }

    map.get(prop)?.set(key, value);
  });

  return map;
}
