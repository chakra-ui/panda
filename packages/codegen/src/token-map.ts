import type { Tokens } from '@css-panda/types';
import { traverse } from 'object-traversal';
import { isString } from 'lodash';

export function getColorsMap(colors: Tokens['colors']) {
  const map = new Map<string, string>();
  traverse(colors, function walk(ctx) {
    const { depth, nodePath } = ctx.meta;
    const single = depth === 1 && isString(ctx.value);
    const nested = depth > 1;
    if ((single || nested) && nodePath) {
      map.set(nodePath, ctx.value);
    }
  });
  return map;
}

export function getFontSizeMap(values: Tokens['fontSizes']) {
  const map = new Map<string, string>();
  traverse(
    values,
    function walk(ctx) {
      const { nodePath } = ctx.meta;
      if (!nodePath) return;
      map.set(
        nodePath,
        isString(ctx.value) ? { fontSize: ctx.value } : ctx.value
      );
    },
    { maxDepth: 1 }
  );

  return map;
}

export function getTokenMap(values: Record<string, string | number>) {
  const map = new Map<string, string>();
  traverse(
    values,
    function walk(ctx) {
      const { nodePath } = ctx.meta;
      if (!nodePath) return;
      map.set(nodePath, ctx.value);
    },
    { maxDepth: 1 }
  );
  return map;
}
