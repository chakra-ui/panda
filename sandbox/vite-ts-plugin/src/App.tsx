import { css } from '../styled-system/css'
import { Stack } from '../styled-system/jsx'
import { stack, vstack } from '../styled-system/patterns'
import { button } from '../styled-system/recipes'

function App() {
  return (
    <div className={stack({ padding: '40px', align: 'stretch' })}>
      <section className={css({ padding: '5', borderWidth: '1px' })}>
        <p className={css({ fontWeight: 'semibold', mb: '2' })}>CSS Function</p>
        <div className={css({ maxWidth: '840px', marginX: 'auto', textAlign: 'center' })}>
          <h1 className={css({ color: 'teal.500', fontSize: '56px', lineHeight: '1.1em' })}>
            Panda CSS Vite Plugin
          </h1>
          <p className={css({ color: 'gray.600', fontSize: '20px', marginTop: '40px' })}>
            This sandbox tests the @pandacss/vite plugin with virtual:panda.css
          </p>

          <div className={css({ marginTop: '40px', display: 'inline-flex', gap: '4' })}>
            <button
              className={css({
                height: '40px',
                background: 'red.200',
                color: 'red.500',
                borderRadius: '8px',
                paddingX: '24px',
              })}
            >
              Get Started
            </button>
            <button
              className={css({
                height: '40px',
                background: 'gray.200',
                borderRadius: '8px',
                paddingX: '24px',
              })}
            >
              Github
            </button>
          </div>
        </div>
      </section>

      <section className={css({ padding: '5', borderWidth: '1px' })}>
        <p className={css({ fontWeight: 'semibold', mb: '2' })}>Recipes</p>
        <div className={css({ display: 'flex', gap: '4' })}>
          <button className={button({ variant: 'primary', size: 'md' })}>Primary MD</button>
          <button className={button({ variant: 'danger', size: 'sm' })}>Danger SM</button>
        </div>
      </section>

      <section className={css({ padding: '5', borderWidth: '1px' })}>
        <p className={css({ fontWeight: 'semibold', mb: '2' })}>Patterns</p>
        <div className={vstack({ gap: '4', bg: 'green.100', padding: '4' })}>
          <Stack gap="4" direction="row">
            <div className={css({ color: 'red.500', fontWeight: 'bold' })}>Item 1</div>
            <div className={css({ color: 'blue.500', fontWeight: 'bold' })}>Item 2</div>
            <div className={css({ color: 'green.500', fontWeight: 'bold' })}>Item 3</div>
          </Stack>
        </div>
      </section>
    </div>
  )
}

export default App
