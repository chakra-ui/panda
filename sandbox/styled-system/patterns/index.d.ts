import { UserCssObject, UserConditionalValue } from "../types/public"
import { Properties } from "../types/csstype"
import { Tokens } from "../types/token"

export type StackOptions = {
   align?: UserCssObject["alignItems"]
	justify?: UserCssObject["justifyContent"]
	direction?: UserCssObject["flexDirection"]
	gap?: UserConditionalValue<Tokens["spacing"]>
}
export declare function stack(options: StackOptions): string

export type AbsoluteCenterOptions = {
   axis?: UserConditionalValue<"x" | "y" | "both">
}
export declare function absoluteCenter(options: AbsoluteCenterOptions): string

export type SimpleGridOptions = {
   gap?: UserConditionalValue<Tokens["spacing"]>
	columns?: UserConditionalValue<number>
	minChildWidth?: UserConditionalValue<Tokens["sizes"] | Properties["width"]>
}
export declare function simpleGrid(options: SimpleGridOptions): string