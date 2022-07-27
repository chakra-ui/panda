import type { DotPath, Loose, TDotPath } from './shared';
import type {
  CSSKeyframes,
  CSSPropertiesWithSelectors,
  CSSProperty,
} from './css-type';

type TCondition = {
  [condition: string]: {
    selector?: string | string[];
    '@media'?: string;
  };
};

type TBreakpoints = {
  [breakpoint: string]: string;
};

type TTokens = {
  [key: string]: string | TTokens;
};

type SemanticTokens<Tokens extends TDotPath, Conditions, Breakpoints> = {
  [K in keyof Tokens]?: {
    [token: string]: {
      [P in keyof Conditions | keyof Breakpoints | '_']?: DotPath<Tokens>;
    };
  };
};

type TokensMap<Tokens> = {
  [K in keyof Tokens]?: Array<CSSProperty | Loose>;
};

type Shorthands = {
  [shorthand: string]: Array<CSSProperty>;
};

type TokenGetter<T extends TDotPath> = (
  token: DotPath<T>
) => string | undefined;

type Utilities<T extends TDotPath> = {
  [utility: string]: (options: {
    value: string;
    $: TokenGetter<T>;
  }) => CSSPropertiesWithSelectors;
};

export type Format = 'css' | 'cjs' | 'esm' | 'dts' | 'all';

export type Config<
  Conditions extends TCondition,
  Breakpoints extends TBreakpoints,
  Tokens extends TTokens
> = {
  format: Format[];
  outfile: string;
  prefix: string;
  incremental: boolean;
  content: string[];
  conditions: Conditions;
  breakpoints: Breakpoints;
  keyframes: CSSKeyframes;
  tokens: Tokens;
  tokensMap: TokensMap<Tokens>;
  semanticTokens: SemanticTokens<Tokens, Conditions, Breakpoints>;
  shorthands: Shorthands;
  utilities: Utilities<Tokens>;
};

export type TConfig = Config<TCondition, TBreakpoints, TTokens>;

export function defineConfig<
  Conditions extends TCondition,
  Breakpoints extends TBreakpoints,
  Tokens extends TTokens
>(
  config: Partial<Config<Conditions, Breakpoints, Tokens>>
): Partial<Config<Conditions, Breakpoints, Tokens>> {
  return config;
}

export default defineConfig({
  conditions: {
    light: { selector: '.light' },
    dark: { selector: '.dark' },
    focus: { selector: '&:focus-visible' },
    hover: { selector: ['&:hover', '&[data-hover]'] },
    'motion-safe': { '@media': '(prefers-reduced-motion: reduce)' },
  },
  breakpoints: {
    sm: '420px',
    md: '768px',
    lg: '960px',
    xl: '1200px',
  },
  keyframes: {
    spin: {
      from: {
        opacity: 1,
      },
      '80%': {
        opacity: 0,
      },
    },
  },
  tokens: {
    colors: {
      red: '#ff0000',
    },
    opacity: {
      '0': '0',
      '25': '0.25',
      '50': '0.5',
    },
  },
  tokensMap: {
    colors: ['backgroundColor', 'color'],
    opacity: ['bgOpacity'],
  },
  semanticTokens: {
    colors: {
      error: { _: 'colors.red', dark: 'colors.red' },
    },
  },
  shorthands: {
    px: ['paddingLeft', 'paddingRight'],
    py: ['paddingTop', 'paddingBottom'],
  },
  utilities: {
    bgOpacity({ value }) {
      return {
        vars: {
          '--bg-opacity': value,
        },
      };
    },
  },
});
