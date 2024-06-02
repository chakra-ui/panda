/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { GridItemProperties } from "../patterns/grid-item";

export interface GridItemProps
  extends GridItemProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof GridItemProperties> {}

export declare const GridItem: FunctionComponent<GridItemProps>;
