/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { SpacerProperties } from "../patterns/spacer";

export interface SpacerProps
  extends SpacerProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof SpacerProperties> {}

export declare const Spacer: FunctionComponent<SpacerProps>;
