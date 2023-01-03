import { SystemStyleObject, ConditionalValue } from "../types"
import { Properties } from "../types/csstype"
import { Tokens } from "../types/token"

export type GridProperties = {
   gap?: ConditionalValue<Tokens["spacing"]>
	columns?: ConditionalValue<number>
	minChildWidth?: ConditionalValue<Tokens["sizes"] | Properties["width"]>
}



export declare function grid(options: SystemStyleObject<GridProperties>): string
