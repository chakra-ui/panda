/* eslint-disable */
import type { Tokens } from "../tokens/index.d.ts";
import type { Properties } from "../types/csstype.d.ts";
import type { ConditionalValue, SystemStyleObject } from "../types/index.d.ts";
import type { SystemProperties } from "../types/style-props.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

export interface StackProperties {
  align?: SystemProperties["alignItems"];
  justify?: SystemProperties["justifyContent"];
  direction?: SystemProperties["flexDirection"];
  gap?: SystemProperties["gap"];
}

interface StackStyles
  extends StackProperties,
    DistributiveOmit<SystemStyleObject, keyof StackProperties> {}

interface StackPatternFn {
  (styles?: StackStyles): string;
  raw: (styles?: StackStyles) => SystemStyleObject;
}

export declare const stack: StackPatternFn;
