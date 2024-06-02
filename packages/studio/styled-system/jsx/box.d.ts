/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { BoxProperties } from "../patterns/box";

export interface BoxProps
  extends BoxProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof BoxProperties> {}

export declare const Box: FunctionComponent<BoxProps>;
