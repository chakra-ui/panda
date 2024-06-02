/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { CenterProperties } from "../patterns/center";

export interface CenterProps
  extends CenterProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof CenterProperties> {}

export declare const Center: FunctionComponent<CenterProps>;
