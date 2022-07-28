import { Properties } from './css-type';
import { TokenCategory } from './tokens';

type Getter = (category: TokenCategory) => Record<string, string>;

type AtomicProperties<P> = {
  [K in keyof P]?:
    | P[K][]
    | { [token: string]: string }
    | (($: Getter) => Record<string, string>);
};

export function defineAtomicProperties<P extends Properties>(config: {
  properties: AtomicProperties<P>;
  conditions?: string[];
  shorthands?: Record<string, string[]>;
}) {
  return config;
}
