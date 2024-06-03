/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { BleedProperties } from "../patterns/bleed";

export interface BleedProps
  extends BleedProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof BleedProperties> {}

export declare const Bleed: FunctionComponent<BleedProps>;
