import { expect, test } from 'vitest'
import { mergeCss } from '../src/merge-css'

test('merge two css strings', () => {
  const oldCss = `
        @layer recipe {
            .button--small {
                font-size: 0.8rem;
                padding: 0.5rem 1rem;
            }
        }

        @layer utilities {
        .p-4 { padding: 1rem }
        }
    `
  const newCss = `
        @layer recipe {
            .button--small {
                font-size: 40px;
                padding: 20rem 1rem;
            }
        }

        @layer utilities {
            .p-2 { padding: 0.5rem }
        }

        .p-4 { padding: 2rem }
    `

  const mergedCss = mergeCss(oldCss, newCss)

  expect(mergedCss).toMatchInlineSnapshot(`
    ".p-4 {
      padding: 2rem
    }

    @layer recipe {
      .button--small {
        font-size: 40px;
        padding: 20rem 1rem;
      }
    }

    @layer utilities {
      .p-2 {
        padding: 0.5rem
      }

      .p-4 {
        padding: 1rem
      }
    }
        "
  `)
})
