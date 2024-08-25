/* eslint-disable */
import type { Tokens } from "../tokens/index.d.ts";
import type { Properties } from "../types/csstype.d.ts";
import type { ConditionalValue, SystemStyleObject } from "../types/index.d.ts";
import type { SystemProperties } from "../types/style-props.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

export interface AspectRatioProperties {
  ratio?: ConditionalValue<number>;
}

interface AspectRatioStyles
  extends AspectRatioProperties,
    DistributiveOmit<
      SystemStyleObject,
      keyof AspectRatioProperties | "aspectRatio"
    > {}

interface AspectRatioPatternFn {
  (styles?: AspectRatioStyles): string;
  raw: (styles?: AspectRatioStyles) => SystemStyleObject;
}

export declare const aspectRatio: AspectRatioPatternFn;
