/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { DividerProperties } from "../patterns/divider";

export interface DividerProps
  extends DividerProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof DividerProperties> {}

export declare const Divider: FunctionComponent<DividerProps>;
