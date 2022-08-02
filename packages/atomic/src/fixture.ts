import postcss from 'postcss';
import { GeneratorContext } from './types';

const propMap = {
  display: 'd',
  height: 'h',
  width: 'w',
  minHeight: 'min-h',
  textAlign: 'ta',
};

export const createContext = (): GeneratorContext => ({
  root: postcss.root(),
  conditions: {
    sm: { type: 'at-rule', value: 'sm', name: 'screen' },
    md: { type: 'at-rule', value: 'md', name: 'screen' },
    lg: { type: 'at-rule', value: 'lg', name: 'screen' },
    ltr: { type: 'selector', value: '[dir=ltr] &' },
    rtl: { type: 'selector', value: '[dir=rtl] &' },
    light: { type: 'selector', value: '[data-theme=light] &' },
    dark: { type: 'selector', value: '[data-theme=dark] &' },
    hover: { type: 'pseudo', value: '&:hover' },
  },
  transform: (prop, value) => {
    const key = propMap[prop] ?? prop;
    return {
      className: `${key}-${value}`,
      styles: { [prop]: value },
    };
  },
});
