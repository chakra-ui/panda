/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type SquareProperties = {
   size?: PropertyValue<'width'>
}


type SquareOptions = SquareProperties & Omit<SystemStyleObject, keyof SquareProperties >


export declare function square(options?: SquareOptions): string
