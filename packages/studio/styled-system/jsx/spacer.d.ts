/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { SpacerProperties } from "../patterns/spacer";

export interface SpacerProps
  extends SpacerProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof SpacerProperties> {}

export declare const Spacer: FunctionComponent<SpacerProps>;
