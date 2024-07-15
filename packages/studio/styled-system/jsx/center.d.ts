/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { CenterProperties } from "../patterns/center";

export interface CenterProps
  extends CenterProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof CenterProperties> {}

export declare const Center: FunctionComponent<CenterProps>;
