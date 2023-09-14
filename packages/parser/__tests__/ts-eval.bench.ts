import { bench, describe } from 'vitest'
import { getFixtureProject } from './fixture'
import type { Config, TSConfig } from '@pandacss/types'

const run = (code: string, userConfig?: Config, tsconfig?: TSConfig) => {
  const { parse, generator } = getFixtureProject(code, userConfig, tsconfig)
  const result = parse()!
  return {
    json: result?.toArray().map(({ box, ...item }) => item),
    css: generator.getParserCss(result)!,
  }
}

describe('ts-eval', () => {
  bench(
    'with ts-eval',
    () => {
      const code = `
    const variants = () => {
        const spacingTokens = Object.entries({
            s: 'token(spacing.1)',
            m: 'token(spacing.2)',
            l: 'token(spacing.3)',
        });

        const spacingProps = {
            'px': 'paddingX',
            'py': 'paddingY',
        };

        // Generate variants programmatically
        return Object.entries(spacingProps)
            .map(([name, styleProp]) => {
                const variants = spacingTokens
                    .map(([variant, token]) => ({ [variant]: { [styleProp]: token } }))
                    .reduce((_agg, kv) => ({ ..._agg, ...kv }));

                return { [name]: variants };
            })
            .reduce((_agg, kv) => ({ ..._agg, ...kv }));
      }
      const baseStyle = cva({
          variants: variants(),
      })
      `

      run(code)
    },
    { iterations: 50 },
  )

  bench(
    'without ts-eval',
    () => {
      const code = `const variants = () => {
            return {"px":{"s":{"paddingX":"token(spacing.1)"},"m":{"paddingX":"token(spacing.2)"},"l":{"paddingX":"token(spacing.3)"}},"py":{"s":{"paddingY":"token(spacing.1)"},"m":{"paddingY":"token(spacing.2)"},"l":{"paddingY":"token(spacing.3)"}}}
          }
          const baseStyle = cva({
              variants: variants(),
          })`

      run(code)
    },
    { iterations: 50 },
  )
})
