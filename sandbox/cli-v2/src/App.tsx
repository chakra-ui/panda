import { css, cva, cx } from 'styled-system/css/index.mjs'
import { createRecipeContext, panda } from 'styled-system/jsx/index.mjs'
import { button } from 'styled-system/recipes/index.mjs'

const Button = createRecipeContext(button).withContext('button')

const badge = cva({
  base: {
    display: 'inline-flex',
    borderRadius: '9px',
    paddingInline: '10px',
    paddingBlock: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  variants: {
    tone: {
      brand: {
        backgroundColor: 'brand.50',
        color: 'brand.700',
      },
      danger: {
        backgroundColor: 'danger.500',
        color: 'white',
      },
    },
  },
  defaultVariants: {
    tone: 'brand',
  },
})

const Notice = panda('div', {
  base: {
    fontFamily: 'Monaspace Neon',
    background: 'red',
    color: 'white',
    paddingInline: '16px',
  },
  variants: {
    type: {
      warning: { background: 'orange' },
      info: { background: 'blue' },
    },
  },
})

const Testing = panda.code

export function App() {
  return (
    <main
      className={css({
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: 'brand.50',
        color: 'brand.700',
      })}
    >
      <section
        className={css({
          display: 'grid',
          gap: '50px',
          padding: '32px',
          borderRadius: '12px',
          backgroundColor: 'white',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.16)',
        })}
      >
        <Notice type="warning">This is notice</Notice>
        <h1 className={css({ fontSize: '100px', fontWeight: '700' })}>Panda v2 CLI Sandbox</h1>
        <span className={css({ color: 'orange', fontSize: '20px', '&:hover': { color: 'red' } })}>Welcome</span>
        <p className={badge({ tone: 'brand' })}>v2-compatible CSS output</p>
        <div className={css({ display: 'flex', gap: '12px' })}>
          <button className={button()}>Primary</button>
          <button className={cx(button({ tone: 'danger', size: 'sm' }), css({ borderWidth: '1px' }))}>Danger</button>
        </div>

        <panda.div display="grid" gap="16px">
          <Testing background="orange" paddingInline="40px" paddingBlock="30px">
            Thinking
          </Testing>
          <panda.p fontSize="50px" color="pink">
            React JSX factory output
          </panda.p>
          <panda.section display="grid" gap="12px" padding="16px" borderRadius="12px" backgroundColor="brand.50">
            <panda.div display="flex" gap="12px">
              <Button>JSX Primary</Button>
              <Button tone="danger" size="sm">
                JSX Danger
              </Button>
              <Button tone="danger" size="lg">
                JSX Danger
              </Button>
            </panda.div>
          </panda.section>
        </panda.div>
      </section>
    </main>
  )
}
