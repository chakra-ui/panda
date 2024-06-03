/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { GridProperties } from "../patterns/grid";

export interface GridProps
  extends GridProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof GridProperties> {}

export declare const Grid: FunctionComponent<GridProps>;
