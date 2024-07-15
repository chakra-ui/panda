/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { BoxProperties } from "../patterns/box";

export interface BoxProps
  extends BoxProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof BoxProperties> {}

export declare const Box: FunctionComponent<BoxProps>;
