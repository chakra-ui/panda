/* eslint-disable */
import type { Tokens } from "../tokens/index.d.ts";
import type { Properties } from "../types/csstype.d.ts";
import type { ConditionalValue, SystemStyleObject } from "../types/index.d.ts";
import type { SystemProperties } from "../types/style-props.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

export interface CqProperties {
  name?: ConditionalValue<
    Tokens["containerNames"] | Properties["containerName"]
  >;
  type?: SystemProperties["containerType"];
}

interface CqStyles
  extends CqProperties,
    DistributiveOmit<SystemStyleObject, keyof CqProperties> {}

interface CqPatternFn {
  (styles?: CqStyles): string;
  raw: (styles?: CqStyles) => SystemStyleObject;
}

export declare const cq: CqPatternFn;
