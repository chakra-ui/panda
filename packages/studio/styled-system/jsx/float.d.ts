/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { FloatProperties } from "../patterns/float";

export interface FloatProps
  extends FloatProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof FloatProperties> {}

export declare const Float: FunctionComponent<FloatProps>;
