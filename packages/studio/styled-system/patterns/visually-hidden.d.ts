/* eslint-disable */
import type { Tokens } from "../tokens/index.d.ts";
import type { Properties } from "../types/csstype.d.ts";
import type { ConditionalValue, SystemStyleObject } from "../types/index.d.ts";
import type { SystemProperties } from "../types/style-props.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

export interface VisuallyHiddenProperties {}

interface VisuallyHiddenStyles
  extends VisuallyHiddenProperties,
    DistributiveOmit<SystemStyleObject, keyof VisuallyHiddenProperties> {}

interface VisuallyHiddenPatternFn {
  (styles?: VisuallyHiddenStyles): string;
  raw: (styles?: VisuallyHiddenStyles) => SystemStyleObject;
}

export declare const visuallyHidden: VisuallyHiddenPatternFn;
