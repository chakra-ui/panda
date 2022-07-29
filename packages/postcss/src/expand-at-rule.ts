import { Root } from 'postcss';
import { Breakpoints, buildMediaQuery } from './breakpoints';

export function expandAtRule(breakpoints: Record<string, string>) {
  const bp = new Breakpoints(breakpoints);
  return (root: Root) => {
    root.walkAtRules('screen', (rule) => {
      const definition = bp.details.find((dfn) => dfn.name === rule.params);

      if (!definition) {
        throw rule.error(`No \`${screen}\` screen found.`);
      }

      rule.name = 'media';
      rule.params = buildMediaQuery(definition);
    });
  };
}
