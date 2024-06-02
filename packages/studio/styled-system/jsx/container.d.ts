/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { ContainerProperties } from "../patterns/container";

export interface ContainerProps
  extends ContainerProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof ContainerProperties> {}

export declare const Container: FunctionComponent<ContainerProps>;
