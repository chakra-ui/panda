/* eslint-disable */
import type { Tokens } from "../tokens/index.d.ts";
import type { Properties } from "../types/csstype.d.ts";
import type { ConditionalValue, SystemStyleObject } from "../types/index.d.ts";
import type { SystemProperties } from "../types/style-props.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

export interface LinkOverlayProperties {}

interface LinkOverlayStyles
  extends LinkOverlayProperties,
    DistributiveOmit<SystemStyleObject, keyof LinkOverlayProperties> {}

interface LinkOverlayPatternFn {
  (styles?: LinkOverlayStyles): string;
  raw: (styles?: LinkOverlayStyles) => SystemStyleObject;
}

export declare const linkOverlay: LinkOverlayPatternFn;
