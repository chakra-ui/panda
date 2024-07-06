/* eslint-disable */
import type { Tokens } from "../tokens/index.d.ts";
import type { Properties } from "../types/csstype.d.ts";
import type { ConditionalValue, SystemStyleObject } from "../types/index.d.ts";
import type { SystemProperties } from "../types/style-props.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

export interface VstackProperties {
  justify?: SystemProperties["justifyContent"];
  gap?: SystemProperties["gap"];
}

interface VstackStyles
  extends VstackProperties,
    DistributiveOmit<SystemStyleObject, keyof VstackProperties> {}

interface VstackPatternFn {
  (styles?: VstackStyles): string;
  raw: (styles?: VstackStyles) => SystemStyleObject;
}

export declare const vstack: VstackPatternFn;
