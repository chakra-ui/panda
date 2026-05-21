import { css } from '../../styled-system/css'
import { solidButton, outlineButton, heroStyles } from '@v2-ds-example/lib'


const panel = css({
  bg: 'surface',
  color: 'gray.900',
  p: '6',
  borderRadius: '12px',
  borderWidth: '2px',
  borderColor: "brand2",
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
})

const page = css({
  bg: 'gray.50',
  minHeight: '100vh',
  p: '10',
  display: 'flex',
  flexDirection: 'column',
  gap: '8',
  alignItems: 'flex-start',
})

const row = css({ display: 'flex', gap: '3', alignItems: 'center' })

export default function Home() {
  return (
    <main className={page}>
      <section className={heroStyles}>
        v2-ds-example — app consuming @v2-ds-example/lib
      </section>

      <div className={row}>
        <button className={solidButton}>solid</button>
        <button className={outlineButton}>outline</button>
      </div>

      <div className={panel}>
        <strong>app-local panel</strong>
        <span>border uses `brand2`, defined only in the app's panda.config</span>
      </div>
    </main>
  )
}
