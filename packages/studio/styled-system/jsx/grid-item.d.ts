/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { GridItemProperties } from "../patterns/grid-item";

export interface GridItemProps
  extends GridItemProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof GridItemProperties> {}

export declare const GridItem: FunctionComponent<GridItemProps>;
