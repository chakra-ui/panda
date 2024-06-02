/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { FlexProperties } from "../patterns/flex";

export interface FlexProps
  extends FlexProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof FlexProperties> {}

export declare const Flex: FunctionComponent<FlexProps>;
