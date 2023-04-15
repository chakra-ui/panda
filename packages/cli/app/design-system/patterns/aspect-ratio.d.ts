import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../types/token'

export type AspectRatioProperties = {
   ratio?: ConditionalValue<number>
}

        
type AspectRatioOptions = AspectRatioProperties & Omit<SystemStyleObject, keyof AspectRatioProperties | 'aspectRatio'>


export declare function aspectRatio(options?: AspectRatioOptions): string
