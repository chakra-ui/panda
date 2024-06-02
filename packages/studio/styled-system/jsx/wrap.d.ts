/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { WrapProperties } from "../patterns/wrap";

export interface WrapProps
  extends WrapProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof WrapProperties> {}

export declare const Wrap: FunctionComponent<WrapProps>;
