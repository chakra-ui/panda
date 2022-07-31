import { Primitive } from './shared';

export type TCondition =
  | {
      type: 'selector';
      name: string;
    }
  | {
      type: '@media';
      params: string;
    };

export type TConditions = {
  [key: string]: TCondition;
};

export type RecursiveCondition<Value extends Primitive, Condition extends Primitive> =
  | Value
  | { [K in Condition]?: RecursiveCondition<Value, Exclude<Condition, K>> };
