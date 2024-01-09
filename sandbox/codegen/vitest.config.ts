import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import Vue from '@vitejs/plugin-vue'
import preact from '@preact/preset-vite'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { UserConfig } from 'vite'
import { UserConfig as TestUserConfig } from 'vitest'

import { createRequire } from 'module'

const generateCjsAlias = (cjsPackages: Array<string>) => {
  const require = createRequire(import.meta.url)

  return cjsPackages.map((p) => ({
    find: p,
    replacement: require.resolve(p),
  }))
}

const options: TestUserConfig = {
  react: {
    test: {
      include: ['**/__tests__/*.{test,spec}.{j,t}s?(x)'],
      environment: 'happy-dom',
    },
  },
  'strict-tokens': {
    test: {
      include: ['**/__tests__/scenarios/strict-tokens.{test,spec}.{j,t}s?(x)'],
    },
  },
  'strict-property-values': {
    test: {
      include: ['**/__tests__/scenarios/strict-property-values.{test,spec}.{j,t}s?(x)'],
    },
  },
  strict: {
    test: {
      include: ['**/__tests__/scenarios/strict.{test,spec}.{j,t}s?(x)'],
    },
  },
  'jsx-minimal': {
    test: {
      environment: 'happy-dom',
      include: ['**/__tests__/scenarios/jsx-minimal.{test,spec}.{j,t}s?(x)'],
    },
  },
  'jsx-none': {
    test: {
      environment: 'happy-dom',
      include: ['**/__tests__/scenarios/jsx-none.{test,spec}.{j,t}s?(x)'],
    },
  },
  //
  preact: {
    plugins: [preact()],
    resolve: {
      // https://github.com/vitest-dev/vitest/issues/1652#issuecomment-1195323396
      alias: [...generateCjsAlias(['preact/hooks', '@testing-library/preact'])],
    },
    test: {
      include: ['**/__tests__/**/frameworks/preact.*.{test,spec}.{j,t}s?(x)'],
      environment: 'jsdom',
    },
  },
  vue: {
    plugins: [Vue(), vueJsx()],
    test: {
      include: ['**/__tests__/**/frameworks/vue.*.{test,spec}.{j,t}s?(x)'],
      environment: 'happy-dom',
    },
  },
  solid: {
    plugins: [solid()],
    test: {
      include: ['**/__tests__/**/frameworks/solid.*.{test,spec}.{j,t}s?(x)'],
      environment: 'happy-dom',
      globals: true,
      deps: {
        inline: [/solid-js/, /@solidjs\/router/],
        registerNodeLoader: false,
      },
    },
  },
  qwik: {
    test: {
      include: ['**/__tests__/**/frameworks/qwik.*.{test,spec}.{j,t}s?(x)'],
      environment: 'node',
    },
  },
} as Record<string, UserConfig>

const mode = process.env.MODE ?? 'react'
console.log({ mode })
export default defineConfig(options[mode])
