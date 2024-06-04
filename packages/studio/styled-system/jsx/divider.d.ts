/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { DividerProperties } from "../patterns/divider";

export interface DividerProps
  extends DividerProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof DividerProperties> {}

export declare const Divider: FunctionComponent<DividerProps>;
