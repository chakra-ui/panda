import { fixtureDefaults } from '@pandacss/fixture'
import type { StaticCssOptions } from '@pandacss/types'
import { bench, describe } from 'vitest'
import { Context } from '../src/context'

describe('static-css performance', () => {
  // Create a large token configuration similar to issue #3106
  const largeTokenConfig = {
    fontSizes: Object.fromEntries(Array.from({ length: 35 }, (_, i) => [`${i + 1}`, { value: `${0.5 + i * 0.25}em` }])),
    sizes: Object.fromEntries([
      ...Array.from({ length: 200 }, (_, i) => [`${i}`, { value: `${i * 0.25}em` }]),
      ['auto', { value: 'auto' }],
      ['full', { value: '100%' }],
      ['1/2', { value: '50%' }],
      ['1/3', { value: '33.333333%' }],
      ['2/3', { value: '66.666667%' }],
      ['1/4', { value: '25%' }],
      ['3/4', { value: '75%' }],
    ]),
    colors: Object.fromEntries(
      ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'gray'].flatMap((color) =>
        Array.from({ length: 10 }, (_, i) => [`${color}.${i * 100}`, { value: `${color}${i * 100}` }]),
      ),
    ),
  }

  const { hooks, ...defaults } = fixtureDefaults
  const conf = {
    hooks,
    ...defaults,
    config: {
      ...defaults.config,
      theme: {
        ...defaults.config.theme,
        tokens: {
          ...defaults.config.theme?.tokens,
          ...largeTokenConfig,
        },
      },
    },
  } as typeof fixtureDefaults

  const ctx = new Context(conf)

  // Large staticCss config with wildcards (expensive to process)
  const largeStaticCssConfig: StaticCssOptions = {
    css: [
      { properties: { fontSize: ['*'] } }, // 35 values
      { properties: { width: ['*'], height: ['*'] } }, // 200+ values each
      { properties: { padding: ['*'], margin: ['*'] } }, // 200+ values each
      { properties: { color: ['*'] } }, // 70 values
    ],
  }

  // Medium staticCss config (more realistic)
  const mediumStaticCssConfig: StaticCssOptions = {
    css: [
      {
        properties: {
          fontSize: Array.from({ length: 10 }, (_, i) => `${i + 1}`),
          padding: Array.from({ length: 20 }, (_, i) => `${i}`),
          margin: Array.from({ length: 20 }, (_, i) => `${i}`),
        },
      },
    ],
  }

  // Recipe-based config
  const recipeStaticCssConfig: StaticCssOptions = {
    recipes: {
      buttonStyle: [{ size: ['sm', 'md'] }, { variant: ['primary', 'secondary'] }],
    },
  }

  bench(
    'large config: initial processing (cache miss)',
    () => {
      // Fresh clone for each iteration to ensure cache miss
      const staticCss = ctx.staticCss.clone()
      staticCss.process(largeStaticCssConfig)
    },
    { warmupIterations: 2, iterations: 10 },
  )

  bench(
    'large config: subsequent processing (cache hit)',
    () => {
      // Reuse same instance to test cache hits
      ctx.staticCss.process(largeStaticCssConfig)
    },
    { warmupIterations: 5, iterations: 50 },
  )

  bench(
    'medium config: initial processing (cache miss)',
    () => {
      const staticCss = ctx.staticCss.clone()
      staticCss.process(mediumStaticCssConfig)
    },
    { warmupIterations: 5, iterations: 20 },
  )

  bench(
    'medium config: subsequent processing (cache hit)',
    () => {
      ctx.staticCss.process(mediumStaticCssConfig)
    },
    { warmupIterations: 10, iterations: 100 },
  )

  bench(
    'recipe config: initial processing (cache miss)',
    () => {
      const staticCss = ctx.staticCss.clone()
      staticCss.process(recipeStaticCssConfig)
    },
    { warmupIterations: 10, iterations: 50 },
  )

  bench(
    'recipe config: subsequent processing (cache hit)',
    () => {
      ctx.staticCss.process(recipeStaticCssConfig)
    },
    { warmupIterations: 20, iterations: 200 },
  )

  // Benchmark cache invalidation scenarios
  const staticCssWithInvalidation = ctx.staticCss.clone()

  bench(
    'cache invalidation: recipe change detection',
    () => {
      staticCssWithInvalidation.process({
        recipes: {
          buttonStyle: [{ size: ['sm'] }],
        },
      })
      staticCssWithInvalidation.process({
        recipes: {
          buttonStyle: [{ size: ['md'] }],
        },
      })
    },
    { warmupIterations: 10, iterations: 50 },
  )

  // Benchmark wildcard expansion overhead
  bench(
    'wildcard expansion: fontSize wildcard',
    () => {
      const staticCss = ctx.staticCss.clone()
      staticCss.process({
        css: [{ properties: { fontSize: ['*'] } }],
      })
    },
    { warmupIterations: 5, iterations: 20 },
  )

  bench(
    'wildcard expansion: specific values (no expansion)',
    () => {
      const staticCss = ctx.staticCss.clone()
      staticCss.process({
        css: [
          {
            properties: {
              fontSize: ['1', '2', '3', '4', '5'],
            },
          },
        ],
      })
    },
    { warmupIterations: 10, iterations: 50 },
  )

  // New benchmarks to test Phase 1 optimizations
  bench(
    'optimized: decoder cache benefit (large config)',
    () => {
      // Reuse same instance to test decoder caching
      const staticCss = ctx.staticCss.clone()
      // First call populates decoder cache
      staticCss.process(largeStaticCssConfig)
      // Second call should benefit from decoder cache
      staticCss.process(largeStaticCssConfig)
    },
    { warmupIterations: 3, iterations: 20 },
  )

  bench(
    'optimized: wildcard memoization benefit',
    () => {
      const staticCss = ctx.staticCss.clone()
      // Multiple calls with wildcards should benefit from memoization
      staticCss.process({
        css: [{ properties: { fontSize: ['*'] } }],
      })
      staticCss.process({
        css: [{ properties: { fontSize: ['*'] } }],
      })
      staticCss.process({
        css: [{ properties: { fontSize: ['*'] } }],
      })
    },
    { warmupIterations: 5, iterations: 30 },
  )

  bench(
    'optimized: full cache hit path (all optimizations)',
    () => {
      // Test the full optimized path with decoder cache + wildcard memoization
      ctx.staticCss.process(mediumStaticCssConfig)
      ctx.staticCss.process(mediumStaticCssConfig)
      ctx.staticCss.process(mediumStaticCssConfig)
    },
    { warmupIterations: 10, iterations: 100 },
  )
})
