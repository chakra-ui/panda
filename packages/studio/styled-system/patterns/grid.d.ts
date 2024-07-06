/* eslint-disable */
import type { Tokens } from "../tokens/index.d.ts";
import type { Properties } from "../types/csstype.d.ts";
import type { ConditionalValue, SystemStyleObject } from "../types/index.d.ts";
import type { SystemProperties } from "../types/style-props.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

export interface GridProperties {
  gap?: SystemProperties["gap"];
  columnGap?: SystemProperties["gap"];
  rowGap?: SystemProperties["gap"];
  columns?: ConditionalValue<number>;
  minChildWidth?: ConditionalValue<Tokens["sizes"] | Properties["width"]>;
}

interface GridStyles
  extends GridProperties,
    DistributiveOmit<SystemStyleObject, keyof GridProperties> {}

interface GridPatternFn {
  (styles?: GridStyles): string;
  raw: (styles?: GridStyles) => SystemStyleObject;
}

export declare const grid: GridPatternFn;
