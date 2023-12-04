import { State } from '@/src/hooks/usePlayground'
import { initialCSS } from '@/src/components/Examples/data'

export const parseState = (state: (Omit<State, 'css'> & { css: string | null }) | null) => {
  return state ? { ...state, css: state.css ?? initialCSS } : null
}
