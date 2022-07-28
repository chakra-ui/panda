import { Primitive } from './shared';

export type RecursiveCondition<
  Value extends Primitive,
  Condition extends Primitive
> =
  | Value
  | { [K in Condition]?: RecursiveCondition<Value, Exclude<Condition, K>> };
