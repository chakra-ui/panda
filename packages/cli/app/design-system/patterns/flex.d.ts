import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type FlexProperties = {
   align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
	direction?: PropertyValue<'flexDirection'>
	wrap?: PropertyValue<'flexWrap'>
	basis?: PropertyValue<'flexBasis'>
	grow?: PropertyValue<'flexGrow'>
	shrink?: PropertyValue<'flexShrink'>
}

        
type FlexOptions = FlexProperties & Omit<SystemStyleObject, keyof FlexProperties | 'alignItems' | 'justifyContent' | 'flexDirection' | 'flexDir' | 'flexWrap' | 'flexShrink' | 'flexBasis' | 'flexGrow' | 'flexFlow'>


export declare function flex(options: FlexOptions): string
