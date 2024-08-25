/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { FloatProperties } from "../patterns/float";

export interface FloatProps
  extends FloatProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof FloatProperties> {}

export declare const Float: FunctionComponent<FloatProps>;
