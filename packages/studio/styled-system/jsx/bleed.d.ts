/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { BleedProperties } from "../patterns/bleed";

export interface BleedProps
  extends BleedProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof BleedProperties> {}

export declare const Bleed: FunctionComponent<BleedProps>;
