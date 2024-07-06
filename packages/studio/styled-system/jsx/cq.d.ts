/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { CqProperties } from "../patterns/cq";

export interface CqProps
  extends CqProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof CqProperties> {}

export declare const Cq: FunctionComponent<CqProps>;
