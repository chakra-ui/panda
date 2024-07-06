/* eslint-disable */
import type { Tokens } from "../tokens/index.d.ts";
import type { Properties } from "../types/csstype.d.ts";
import type { ConditionalValue, SystemStyleObject } from "../types/index.d.ts";
import type { SystemProperties } from "../types/style-props.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

export interface SpacerProperties {
  size?: ConditionalValue<Tokens["spacing"]>;
}

interface SpacerStyles
  extends SpacerProperties,
    DistributiveOmit<SystemStyleObject, keyof SpacerProperties> {}

interface SpacerPatternFn {
  (styles?: SpacerStyles): string;
  raw: (styles?: SpacerStyles) => SystemStyleObject;
}

export declare const spacer: SpacerPatternFn;
