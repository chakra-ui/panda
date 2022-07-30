import type * as CSS from 'csstype';
import type { Loose } from './shared';

export type CSSVar = `--${string}`;

export type CSSVarFunction = `var(--${string})` | `var(--${string}, ${string | number})`;

export type Properties = CSS.PropertiesFallback<number | Loose>;

export type CSSProperty = keyof Properties;

export type CSSProperties = {
  [Property in keyof Properties]: Properties[Property] | CSSVarFunction;
};

export type CSSKeyframes = {
  [time: string]: {
    [T in Loose | 'from' | 'to']?: CSSProperties;
  };
};

export type CSSPropertiesWithVars = CSSProperties & {
  vars?: {
    [key: CSSVar]: string;
  };
};

export type PseudoProperties = {
  [key in `&${CSS.SimplePseudos}`]?: CSSPropertiesWithVars;
};

type CSSPropertiesAndPseudos = CSSPropertiesWithVars & PseudoProperties;

export interface MediaQueries<T> {
  '@media'?: {
    [query: string]: T;
  };
}

interface SelectorMap {
  [selector: string]: CSSPropertiesWithVars & MediaQueries<CSSPropertiesWithVars>;
}

export interface CSSPropertiesWithSelectors extends CSSPropertiesAndPseudos {
  selectors?: SelectorMap;
}
