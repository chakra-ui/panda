import { State } from '@/src/hooks/usePlayground'
import { initialCSS } from '@/src/components/Examples/data'

type Param = (Omit<State, 'css'> & { css?: string | null }) & {}
export function parseState<T extends Param | null | undefined>(state: T) {
  return (state ? Object.assign({}, state, { css: state.css ?? initialCSS }) : null) as T extends Param
    ? State
    : T extends undefined
    ? undefined
    : null
}
