/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { CqProperties } from "../patterns/cq";

export interface CqProps
  extends CqProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof CqProperties> {}

export declare const Cq: FunctionComponent<CqProps>;
