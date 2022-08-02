import { Root } from 'postcss';

export type SelectorOutput = {
  before: string[];
  between: string;
  after: string[];
};

export type Condition = {
  type: 'at-rule' | 'pseudo' | 'selector';
  value: string;
  name?: string;
};

export type RawCondition = Condition & { raw: string };

export type Conditions = Record<string, Condition>;

export type TransformResult = {
  className: string;
  styles: Record<string, any>;
};

export type GeneratorContext = {
  root: Root;
  conditions: Conditions;
  transform: (prop: string, value: string) => TransformResult;
};

export type Dict<T = any> = Record<string, T>;
