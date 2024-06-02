/* eslint-disable */
import type { Tokens } from "../tokens/index.d.ts";
import type { Properties } from "../types/csstype.d.ts";
import type { ConditionalValue, SystemStyleObject } from "../types/index.d.ts";
import type { SystemProperties } from "../types/style-props.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

export interface CircleProperties {
  size?: SystemProperties["width"];
}

interface CircleStyles
  extends CircleProperties,
    DistributiveOmit<SystemStyleObject, keyof CircleProperties> {}

interface CirclePatternFn {
  (styles?: CircleStyles): string;
  raw: (styles?: CircleStyles) => SystemStyleObject;
}

export declare const circle: CirclePatternFn;
