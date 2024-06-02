/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { GridProperties } from "../patterns/grid";

export interface GridProps
  extends GridProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof GridProperties> {}

export declare const Grid: FunctionComponent<GridProps>;
