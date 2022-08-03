import { Root } from 'postcss';
import { getBreakpointDetails } from '@css-panda/breakpoint-utils';
import { Dict } from './types';

export function expandScreenAtRule(breakpoints: Dict) {
  const bp = getBreakpointDetails(breakpoints);
  return (root: Root) => {
    root.walkAtRules('screen', (rule) => {
      const definition = bp.get(rule.params);
      if (!definition) {
        throw rule.error(`No \`${screen}\` screen found.`);
      }
      rule.name = 'media';
      rule.params = definition.minQuery;
    });
  };
}
