// A bundle that only composes style objects — recipes and pattern JSX do this.
// It must not drag the class-name serializer along.
import { mergeCss } from '../../../styled-system/css'

export const merged = mergeCss({ color: 'red' }, { color: 'blue' })
