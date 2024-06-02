/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { LinkOverlayProperties } from "../patterns/link-overlay";

export interface LinkOverlayProps
  extends LinkOverlayProperties,
    DistributiveOmit<HTMLPandaProps<"a">, keyof LinkOverlayProperties> {}

export declare const LinkOverlay: FunctionComponent<LinkOverlayProps>;
