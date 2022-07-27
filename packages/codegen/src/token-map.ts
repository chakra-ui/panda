import type { Tokens } from '@css-panda/types';
import { traverse } from 'object-traversal';
import { isString } from 'lodash';

export function getColorsMap(values: Tokens['colors']) {
  const map = new Map<string, string>();

  traverse(values, (ctx) => {
    const { depth, nodePath } = ctx.meta;

    const single = depth === 1 && isString(ctx.value);
    const nested = depth > 1;

    if ((single || nested) && nodePath) {
      map.set(`colors.${nodePath}`, ctx.value);
    }
  });

  return map;
}

export function getFontSizeMap(values: Tokens['fontSizes']) {
  const map = new Map<string, string>();

  traverse(
    values,
    (ctx) => {
      const { nodePath } = ctx.meta;
      if (!nodePath) return;
      map.set(
        `fontSizes.${nodePath}`,
        isString(ctx.value) ? { fontSize: ctx.value } : ctx.value
      );
    },
    { maxDepth: 1 }
  );

  return map;
}

export function getSpacingMap(values: Tokens['spacing']) {
  return getTokenMap('spacing', values, true);
}

export function getTokenMap(
  category: string,
  values: Record<string, string | number>,
  negate = false
) {
  const map = new Map<string, string>();

  traverse(
    values,
    (ctx) => {
      const { nodePath } = ctx.meta;
      if (!nodePath) return;

      const pre = category ? `${category}.` : '';
      map.set(`${pre}${nodePath}`, ctx.value);

      if (negate) {
        map.set(`${pre}-${nodePath}`, `-${ctx.value}`);
      }
    },
    { maxDepth: 1 }
  );

  return map;
}
