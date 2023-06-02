import { css } from '../../styled-system/css'
import { join } from '../../styled-system/patterns'

export default function Home() {
  return (
    <div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
      <div className={join({})}>
        <button>BTN1</button>
        <button>BTN2</button>
        <button>BNT3</button>
        <button>BTN4</button>
      </div>

      <br />

      <div className={join({ scope: '.join-item' })}>
        <button className="join-item">BTN1</button>
        <button className="join-item">BTN2</button>
        <button className="join-item">BNT3</button>
        <div>
          <button className="join-item">BTN4</button>
        </div>
      </div>
    </div>
  )
}
