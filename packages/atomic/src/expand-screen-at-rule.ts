import { Root } from 'postcss';
import { Breakpoints } from './breakpoints';

export function expandScreenAtRule(breakpoints: Record<string, string>) {
  const bp = new Breakpoints(breakpoints);
  return (root: Root) => {
    root.walkAtRules('screen', (rule) => {
      const definition = bp.details.find((dfn) => dfn.name === rule.params);
      if (!definition) {
        throw rule.error(`No \`${screen}\` screen found.`);
      }
      rule.name = 'media';
      rule.params = definition.minQuery;
    });
  };
}
