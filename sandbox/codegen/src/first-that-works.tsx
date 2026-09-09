import { css, firstThatWorks } from '../styled-system/css'
import { probe } from '../styled-system/recipes'

export const FirstThatWorksProbe = () => (
  <div className={probe()}>
    <span className={css({ width: firstThatWorks('fit-content', 'auto') })} />
  </div>
)
